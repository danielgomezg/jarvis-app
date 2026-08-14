import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { MailService } from 'src/modules/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LoginOAuth } from './interfaces/loginOAuth.interface';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  // ─────────────────────────────────────────────────────────────────────────
  // COMO LEER ESTE ARCHIVO
  // ─────────────────────────────────────────────────────────────────────────
  // AuthService es el "cerebro" de la autenticación: crea usuarios, valida
  // logins, maneja sesiones, etc. Todo lo que toca por afuera (la base de
  // datos `prisma`, el emisor de tokens `jwtService`, la config, el mail y
  // bcrypt) está MOCKEADO (fingido), así el test prueba SOLO la lógica del
  // servicio sin depender de nada real.
  //
  // Cada sección `describe()` agrupa los tests de UN método del servicio.
  // Cada `it()` es un caso concreto siguiendo el patrón AAA:
  //   Arrange -> preparamos qué devuelven los mocks (escenario).
  //   Act     -> ejecutamos el método real que queremos probar.
  //   Assert  -> verificamos el resultado con `expect(...)`.
  //
  // Comandos para correr los tests (desde backend-jarvis/):
  //   pnpm run test                -> todos
  //   pnpm run test -- auth.service -> solo este archivo
  //   pnpm run test -- -t "login"   -> solo los tests con "login" en el nombre
  // ─────────────────────────────────────────────────────────────────────────

  const prisma = {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userSession: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    authCredential: {
      create: jest.fn(),
    },
  };

  const jwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
      return undefined;
    }),
  };

  const mailService = {
    sendVerificationEmail: jest.fn(),
  };

  const res = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    jest.clearAllMocks();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-token');
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // getTokens(userId, email): crea los 2 tokens del login.
  // El access token dura 15 minutos; el refresh token dura 7 días.
  // Cada uno usa un secreto distinto (JWT_SECRET vs JWT_REFRESH_SECRET).
  describe('getTokens', () => {
    it('debe generar access token (15m) y refresh token (7d) con secretos distintos', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.getTokens('user-1', 'user@mail.com');

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        { email: 'user@mail.com', sub: 'user-1' },
        { secret: 'test-secret', expiresIn: '15m' },
      );
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { email: 'user@mail.com', sub: 'user-1' },
        { secret: 'test-refresh-secret', expiresIn: '7d' },
      );
    });
  });

  // saveRefreshToken(userId, token): guarda la sesión del usuario.
  // NO guarda el token crudo: lo hashea con bcrypt (así, si la DB se filtra,
  // no se pueden usar los tokens robados) y guarda el hash con expiración.
  describe('saveRefreshToken', () => {
    it('debe hashear el token y crear la sesión con expiración de 7 días', async () => {
      await service.saveRefreshToken('user-1', 'raw-refresh-token');

      expect(bcrypt.hash).toHaveBeenCalledWith('raw-refresh-token', 10);
      expect(prisma.userSession.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          refreshTokenHash: 'hashed-token',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('no debe hacer nada si no se pasa token', async () => {
      await service.saveRefreshToken('user-1', '');

      expect(prisma.userSession.create).not.toHaveBeenCalled();
    });
  });

  // register(dto): alta de usuario con email + contraseña (registro clásico,
  // sin Google/GitHub). Crea el usuario, hashea la contraseña y manda un
  // email de verificación para activar la cuenta.
  describe('register', () => {
    const registerDto: RegisterDto = {
      firstName: 'Juan',
      lastName: 'Perez',
      userName: 'juanperez',
      email: 'juan@mail.com',
      password: 'Password123',
    };

    it('debe crear usuario, hashear password y enviar email de verificación', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const created = {
        email: 'juan@mail.com',
        userName: 'juanperez',
        profile: { firstName: 'Juan', lastName: 'Perez' },
      };
      prisma.user.create.mockResolvedValue(created);
      mailService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result).toEqual(created);
      expect(bcrypt.hash).toHaveBeenCalledWith('Password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'juan@mail.com',
          userName: 'juanperez',
          verificationToken: expect.any(String),
          verificationTokenExpiresAt: expect.any(Date),
          profile: { create: { firstName: 'Juan', lastName: 'Perez' } },
          authCredentials: {
            create: [{ passwordHash: 'hashed-token', provider: 'LOCAL' }],
          },
        }),
        select: expect.any(Object),
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        'juan@mail.com',
        expect.any(String),
        'juanperez',
      );
    });

    it('debe lanzar ConflictException si el email ya existe', async () => {
      prisma.user.findFirst.mockResolvedValue({
        email: 'juan@mail.com',
        userName: 'otrouser',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException(
          'El usuario con este correo electrónico ya existe.',
        ),
      );
    });

    it('debe lanzar ConflictException si el userName ya está en uso', async () => {
      prisma.user.findFirst.mockResolvedValue({
        email: 'otro@mail.com',
        userName: 'juanperez',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('El nombre de usuario ya está en uso.'),
      );
    });

    it('debe lanzar ConflictException si Prisma devuelve P2002', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('debe lanzar InternalServerErrorException en error inesperado de DB', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockRejectedValue(new Error('db down'));

      await expect(service.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('debe completar el registro aunque falle el email de verificación', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      const created = {
        email: 'juan@mail.com',
        userName: 'juanperez',
        profile: { firstName: 'Juan', lastName: 'Perez' },
      };
      prisma.user.create.mockResolvedValue(created);
      mailService.sendVerificationEmail.mockRejectedValue(
        new Error('SendGrid down'),
      );

      const result = await service.register(registerDto);

      expect(result).toEqual(created);
    });
  });

  // login(dto): entrada con email + contraseña. Verifica que el usuario
  // exista, que tenga credencial LOCAL, que esté activo/verificado y que la
  // contraseña coincida. Si todo OK, emite los tokens y setea la cookie
  // `refreshToken` (que es la que mantiene la sesión iniciada en el frontend).
  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'juan@mail.com',
      password: 'Password123',
    };

    const baseUser = {
      id: 'user-1',
      email: 'juan@mail.com',
      isActive: true,
      isVerified: true,
      userName: 'juanperez',
      authCredentials: [{ passwordHash: 'hashed' }],
      profile: { firstName: 'Juan', lastName: 'Perez' },
    };

    it('debe lanzar UnauthorizedException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto, res)).rejects.toThrow(
        new UnauthorizedException('Usuario no encontrado.'),
      );
    });

    it('debe lanzar UnauthorizedException si no tiene credencial LOCAL', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        authCredentials: [],
      });

      await expect(service.login(loginDto, res)).rejects.toThrow(
        new UnauthorizedException(
          'No se encontraron credenciales para este usuario.',
        ),
      );
    });

    it('debe lanzar UnauthorizedException si el usuario no está activo o verificado', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        isActive: false,
        isVerified: true,
      });

      await expect(service.login(loginDto, res)).rejects.toThrow(
        new UnauthorizedException('Usuario no autorizado.'),
      );
    });

    it('debe lanzar UnauthorizedException si la contraseña no coincide', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto, res)).rejects.toThrow(
        new UnauthorizedException('Contraseña incorrecta.'),
      );
    });

    it('debe setear la cookie refreshToken y retornar el usuario y accessToken', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      prisma.userSession.create.mockResolvedValue({});

      const result = await service.login(loginDto, res);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        email: 'juan@mail.com',
        userName: 'juanperez',
        firstName: 'Juan',
        lastName: 'Perez',
      });
    });

    it('debe pasar las HttpException tal cual y envolver errores inesperados en 500', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('db down'));

      await expect(service.login(loginDto, res)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // logout(userId, token): cierra la sesión. Marca como "revocada" la sesión
  // que coincide con el token que viene en la cookie y borra la cookie del
  // navegador (clearCookie).
  describe('logout', () => {
    const session = {
      id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: 'hash',
      isRevoked: false,
      createdAt: new Date(),
      revokedAt: null,
    };

    it('debe lanzar UnauthorizedException si no hay userId', async () => {
      await expect(service.logout('', res, 'refresh-token')).rejects.toThrow(
        new UnauthorizedException('Usuario no autenticado.'),
      );
    });

    it('debe lanzar NotFoundException si ninguna sesión coincide', async () => {
      prisma.userSession.findMany.mockResolvedValue([session]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.logout('user-1', res, 'wrong-token'),
      ).rejects.toThrow(
        new NotFoundException('Sesión no encontrada o ya cerrada.'),
      );
    });

    it('debe revocar la sesión que coincide y limpiar la cookie', async () => {
      prisma.userSession.findMany.mockResolvedValue([session]);

      const result = await service.logout('user-1', res, 'refresh-token');

      expect(prisma.userSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { isRevoked: true, revokedAt: expect.any(Date) },
      });
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });
      expect(result).toEqual({ message: 'Sesión cerrada exitosamente.' });
    });
  });

  // refreshToken(userId, token): renueva los tokens cuando el access token
  // expira (el frontend pide uno nuevo con el refresh token de la cookie).
  // Además ROTA el refresh token (genera uno nuevo) y detecta ROBO de sesión:
  // si llega un token que no coincide con ninguna sesión, revoca TODAS las
  // sesiones del usuario (porque alguien podría estar usando su cuenta).
  describe('refreshToken', () => {
    const recentSession = {
      id: 'session-1',
      userId: 'user-1',
      refreshTokenHash: 'hash',
      isRevoked: false,
      createdAt: new Date(),
      revokedAt: null,
    };

    const oldSession = {
      ...recentSession,
      id: 'session-2',
      createdAt: new Date(Date.now() - 20 * 60 * 1000),
    };

    beforeEach(() => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        email: 'juan@mail.com',
      });
      prisma.user.findUnique.mockResolvedValue({
        userName: 'juanperez',
        profile: { firstName: 'Juan', lastName: 'Perez', avatarUrl: null },
      });
    });

    it('debe lanzar UnauthorizedException si no se provee token', async () => {
      await expect(service.refreshToken('', res)).rejects.toThrow(
        new UnauthorizedException('Token de refresco no proporcionado.'),
      );
    });

    it('debe lanzar UnauthorizedException si el token no verifica', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refreshToken('bad-token', res)).rejects.toThrow(
        new UnauthorizedException('Token de refresco expirado o inválido.'),
      );
    });

    it('debe revocar TODAS las sesiones si el token no coincide con ninguna (robo)', async () => {
      prisma.userSession.findMany.mockResolvedValue([recentSession]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshToken('stolen-token', res)).rejects.toThrow(
        new UnauthorizedException(
          'Token inválido. Todas las sesiones han sido cerradas.',
        ),
      );
      expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: { isRevoked: true, revokedAt: expect.any(Date) },
      });
    });

    it('debe rotar actualizando el hash sin renovar expiración si la sesión es reciente', async () => {
      prisma.userSession.findMany.mockResolvedValue([recentSession]);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      await service.refreshToken('valid-token', res);

      expect(prisma.userSession.update).toHaveBeenCalledWith({
        where: { id: 'session-1' },
        data: { refreshTokenHash: 'hashed-token' },
      });
    });

    it('debe rotar renovando expiración si la sesión tiene más de 15 minutos', async () => {
      prisma.userSession.findMany.mockResolvedValue([oldSession]);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      await service.refreshToken('valid-token', res);

      expect(prisma.userSession.update).toHaveBeenCalledWith({
        where: { id: 'session-2' },
        data: {
          refreshTokenHash: 'hashed-token',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('debe setear nueva cookie y retornar los nuevos tokens y datos del usuario', async () => {
      prisma.userSession.findMany.mockResolvedValue([recentSession]);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access')
        .mockResolvedValueOnce('new-refresh');

      const result = await service.refreshToken('valid-token', res);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });
      expect(result).toEqual({
        accessToken: 'new-access',
        email: 'juan@mail.com',
        firstName: 'Juan',
        lastName: 'Perez',
        userName: 'juanperez',
      });
    });
  });

  // verifyEmail(token): cuando el usuario hace click en el link del email de
  // verificación. Si el token es válido, marca la cuenta como activada.
  describe('verifyEmail', () => {
    it('debe lanzar UnauthorizedException si no se provee token', async () => {
      await expect(service.verifyEmail('')).rejects.toThrow(
        new UnauthorizedException('Token de verificación no proporcionado.'),
      );
    });

    it('debe verificar y activar el usuario si el token es válido', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 'user-1' });
      prisma.user.update.mockResolvedValue({});

      const result = await service.verifyEmail('valid-token');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          verificationToken: null,
          verificationTokenExpiresAt: null,
          isVerified: true,
          isActive: true,
        },
      });
      expect(result).toEqual({
        message: 'Correo electrónico verificado exitosamente.',
      });
    });

    it('comportamiento actual: token inválido termina como 500 (ver nota de bug)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // resendEmailVerification(email): reenvía el email de verificación. Usa un
  // mensaje genérico ("si existe, te mandamos el email") para NO revelar si un
  // email está registrado o no (evita que atacantes enumeren usuarios).
  describe('resendEmailVerification', () => {
    const generic = {
      message:
        'Si el email está registrado, te enviamos un correo de verificación.',
    };

    it('debe actualizar el token y enviar el email, retornando respuesta genérica', async () => {
      prisma.user.update.mockResolvedValue({
        email: 'juan@mail.com',
        userName: 'juanperez',
      });

      const result = await service.resendEmailVerification('juan@mail.com');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { email: 'juan@mail.com' },
        data: {
          verificationToken: expect.any(String),
          verificationTokenExpiresAt: expect.any(Date),
        },
        select: expect.any(Object),
      });
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        'juan@mail.com',
        expect.any(String),
        'juanperez',
      );
      expect(result).toEqual(generic);
    });

    it('no debe revelar si el email no está registrado (P2025 → respuesta genérica)', async () => {
      prisma.user.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('not found', {
          code: 'P2025',
          clientVersion: 'test',
        }),
      );

      const result = await service.resendEmailVerification('noexiste@mail.com');

      expect(result).toEqual(generic);
    });
  });

  // loginOauth(oauthUser): login que llega desde las strategies de Google o
  // GitHub (ya validado por el proveedor). Genera tokens y setea la cookie.
  describe('loginOauth', () => {
    const loginProps: LoginOAuth = {
      userId: 'user-1',
      email: 'juan@mail.com',
      userName: 'juanperez',
      firstName: 'Juan',
      lastName: 'Perez',
      provider: 'GOOGLE',
      provider_account_id: 'google-123',
    };

    it('debe generar tokens, guardar sesión, setear cookie y retornar datos', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      prisma.userSession.create.mockResolvedValue({});

      const result = await service.loginOauth(loginProps, res);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      expect(result).toEqual({
        accessToken: 'access-token',
        email: 'juan@mail.com',
        userName: 'juanperez',
        firstName: 'Juan',
        lastName: 'Perez',
      });
    });

    it('debe propagar HttpException y envolver errores inesperados en 500', async () => {
      jwtService.signAsync.mockRejectedValue(new UnauthorizedException('no'));

      await expect(service.loginOauth(loginProps, res)).rejects.toThrow(
        new UnauthorizedException('no'),
      );

      jwtService.signAsync.mockRejectedValue(new Error('db down'));
      await expect(service.loginOauth(loginProps, res)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  // registerOAuth(oauthUser): alta de usuario vía Google/GitHub. Crea el
  // usuario ya verificado (porque el proveedor confirmó el email) junto con
  // su perfil y su credencial del proveedor.
  describe('registerOAuth', () => {
    it('debe crear usuario verificado con profile y credencial del proveedor', async () => {
      const created = {
        id: 'user-1',
        email: 'juan@mail.com',
        userName: 'juanperez',
        profile: { firstName: 'Juan', lastName: 'Perez' },
      };
      prisma.user.create.mockResolvedValue(created);

      const result = await service.registerOAuth({
        email: 'juan@mail.com',
        userName: 'juanperez',
        firstName: 'Juan',
        lastName: 'Perez',
        provider: 'GOOGLE',
        provider_account_id: 'google-123',
      });

      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'juan@mail.com',
          isActive: true,
          isVerified: true,
          verificationToken: null,
          verificationTokenExpiresAt: null,
          profile: { create: { firstName: 'Juan', lastName: 'Perez' } },
          authCredentials: {
            create: [{ provider: 'GOOGLE', providerAccountId: 'google-123' }],
          },
        }),
        select: expect.any(Object),
      });
      expect(result).toEqual(created);
    });

    it('debe lanzar ConflictException si hay P2002 (email/username duplicado)', async () => {
      prisma.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.registerOAuth({
          email: 'juan@mail.com',
          userName: 'juanperez',
          firstName: 'Juan',
          lastName: 'Perez',
          provider: 'GOOGLE',
          provider_account_id: 'google-123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // validateOAuthUser(oauthUser): lo llaman las strategies. Busca si el email
  // ya está registrado:
  //   - Si NO existe → crea el usuario nuevo (login de primera vez).
  //   - Si existe pero no tiene la credencial de ese proveedor → la vincula
  //     (el usuario ya tenía cuenta con email, ahora también entra con Google).
  //   - Si ya tiene la credencial → devuelve el usuario tal cual.
  //   - Si el usuario está bloqueado → rechaza el login.
  describe('validateOAuthUser', () => {
    const oauthInput = {
      email: 'juan@mail.com',
      userName: '',
      firstName: 'Juan',
      lastName: 'Perez',
      provider: 'GOOGLE',
      provider_account_id: 'google-123',
    };

    it('debe crear un usuario nuevo si el email no existe (genera username único)', async () => {
      prisma.user.findFirst.mockResolvedValueOnce(null); // findByEmail
      prisma.user.findFirst.mockResolvedValueOnce(null); // findByUsername
      prisma.user.findUnique.mockResolvedValue(null); // generateUniqueUsername
      const newUser = {
        id: 'user-new',
        email: 'juan@mail.com',
        userName: 'juan_1234',
        profile: { firstName: 'Juan', lastName: 'Perez' },
      };
      prisma.user.create.mockResolvedValue(newUser);

      const result = await service.validateOAuthUser(oauthInput);

      expect(result).toEqual(newUser);
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('debe lanzar UnauthorizedException si el usuario está bloqueado', async () => {
      prisma.user.findFirst.mockResolvedValue({
        id: 'user-1',
        isActive: false,
        isVerified: true,
        authCredentials: [],
      });

      await expect(service.validateOAuthUser(oauthInput)).rejects.toThrow(
        new UnauthorizedException('Usuario bloquado temporalmente.'),
      );
    });

    it('debe devolver el usuario si ya tiene la credencial del proveedor', async () => {
      const user = {
        id: 'user-1',
        isActive: true,
        isVerified: true,
        authCredentials: [{ provider: 'GOOGLE' }],
      };
      prisma.user.findFirst.mockResolvedValue(user);

      const result = await service.validateOAuthUser(oauthInput);

      expect(result).toEqual(user);
      expect(prisma.authCredential.create).not.toHaveBeenCalled();
    });

    it('debe vincular la credencial si el email existe pero sin el proveedor', async () => {
      const user = {
        id: 'user-1',
        isActive: true,
        isVerified: true,
        authCredentials: [{ provider: 'LOCAL' }],
      };
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.authCredential.create.mockResolvedValue({});

      const result = await service.validateOAuthUser(oauthInput);

      expect(prisma.authCredential.create).toHaveBeenCalledWith({
        data: {
          provider: 'GOOGLE',
          providerAccountId: 'google-123',
          userId: 'user-1',
        },
      });
      expect(result).toEqual(user);
    });

    it('debe verificar/activar al usuario vinculado si no estaba verificado', async () => {
      const user = {
        id: 'user-1',
        isActive: false,
        isVerified: false,
        authCredentials: [{ provider: 'LOCAL' }],
      };
      prisma.user.findFirst.mockResolvedValue(user);
      prisma.authCredential.create.mockResolvedValue({});
      prisma.user.update.mockResolvedValue({});

      await service.validateOAuthUser(oauthInput);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { isVerified: true, isActive: true },
      });
    });
  });

  // generateUsername(email): crea un nombre de usuario automático a partir
  // del email (parte antes de la @ + 4 dígitos aleatorios) para garantizar
  // que sea único en la DB.
  describe('generateUsername', () => {
    it('debe generar un username con base del email y 4 dígitos', () => {
      const username = service.generateUsername('juan.perez@mail.com');

      expect(username).toMatch(/^juan\.perez_\d{4}$/);
    });
  });

  // findByEmail / findByUsername: búsquedas auxiliares de usuario usadas por
  // otros métodos del servicio (traen también sus credenciales).
  describe('findByEmail / findByUsername', () => {
    it('debe retornar el usuario con sus credenciales por email', async () => {
      const user = {
        id: 'user-1',
        email: 'juan@mail.com',
        authCredentials: [{ provider: 'GOOGLE' }],
      };
      prisma.user.findFirst.mockResolvedValue(user);

      const result = await service.findByEmail('juan@mail.com');

      expect(result).toEqual(user);
    });

    it('debe envolver errores inesperados en InternalServerErrorException', async () => {
      prisma.user.findFirst.mockRejectedValue(new Error('db down'));

      await expect(service.findByEmail('juan@mail.com')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
