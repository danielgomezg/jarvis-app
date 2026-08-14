import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/modules/mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterOAuthDto } from './dto/registerOAuth.dto';
import * as bcrypt from 'bcrypt';
import type { Response, Request } from 'express';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { UserSession } from './interfaces/session.interface';
import { LoginOAuth } from './interfaces/loginOAuth.interface';

//REcorDAR DESPUES DE PROBAR
// @Res({ passthrough: true }) res: Response, lo quite del servicio **************************************************************

@Injectable()
export class AuthService {
  // NestJS inyecta automáticamente la conexión a la base de datos
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  // 1. Método para generar access token y refresh token
  async getTokens(userId: string, email: string) {
    const payload = { email, sub: userId };

    // Generamos ambos tokens con diferentes tiempos de expiración y secretos
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m', // ¡Token de Acceso más CORTO!
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d', // Token de Refresco más LARGO
      }),
    ]);

    return { accessToken, refreshToken };
  }

  // 2. Método para hashear y guardar el refresh token en la base de datos
  async saveRefreshToken(userId: string, refreshToken: string) {
    if (!refreshToken) return;

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    try {
      await this.prisma.userSession.create({
        data: {
          userId,
          refreshTokenHash: hashedRefreshToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        },
      });
    } catch (error) {
      //console.error('Error al guardar la sesión:', error);
      console.error(
        'mensaje',
        error instanceof Error ? error.message : String(error),
      );
      throw new InternalServerErrorException('No se pudo guardar la sesión.');
    }
  }

  //CAMBIAR A SI SE HACE EN LOCAL, NO SE PIDE PASS SE ENVIA UN EMAIL DE CONFIRMACION Y AHI SE PIDE LA CONTRASEÑA, SI SE HACE CON GOOGLE O FACEBOOK, SE HACE CON LOS TOKEN Y LUEGO AGREGAR UN METODO PARA QUE EL USUARIO PUEDA AGREGAR UNA CONTRASEÑA DESPUES DE HABERSE REGISTRADO CON GOOGLE O FACEBOOK, PARA PODER INICIAR SESION CON EMAIL Y CONTRASEÑA SI LO DESEA
  async register(registerDto: RegisterDto) {
    const { email, password, userName, firstName, lastName } = registerDto;

    // 1. Buscas por email O por username en una sola consulta
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { userName: userName }],
      },
    });

    // 2. Si encuentra algo, evalúas cuál de los dos campos coincidió y error 409 específico para cada caso
    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException(
          'El usuario con este correo electrónico ya existe.',
        );
      }
      if (existingUser.userName === userName) {
        throw new ConflictException('El nombre de usuario ya está en uso.');
      }
    }

    //3 encriptar la contraseña antes de guardarla en la base de datos
    const hashedPassword = await bcrypt.hash(password, 10);
    // 3.1 Generar token de verificación para enviar por mail
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hs

    try {
      // Aquí puedes agregar lógica para validar el username y password
      const user = await this.prisma.user.create({
        data: {
          email,
          userName: userName,
          verificationToken: verificationToken,
          verificationTokenExpiresAt: expiresAt,
          profile: {
            create: {
              firstName: firstName,
              lastName: lastName,
            },
          },
          authCredentials: {
            create: [
              {
                passwordHash: hashedPassword,
                provider: 'LOCAL', // Puedes ajustar esto según tu lógica de proveedores
              },
            ],
          },
        },
        select: {
          email: true,
          userName: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      try {
        await this.mailService.sendVerificationEmail(
          email,
          verificationToken,
          userName,
        );
      } catch (emailError) {
        // El registro fue exitoso, solo logueamos el fallo del email
        // El usuario puede solicitar reenvío después
        console.error('Error al enviar email de verificación:', emailError);
      }

      return user;
    } catch (error) {
      //console.error('Error al registrar usuario:', error);
      console.error(
        'mensaje',
        error instanceof Error ? error.message : String(error),
      );
      // Manejo de errores específicos de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Este código de error indica una violación de unicidad
          throw new ConflictException(
            'El usuario con este correo electrónico o nombre de usuario ya existe.',
          );
        }
      }
      // 5. Manejo de errores desconocidos o internos (HTTP 500)
      throw new InternalServerErrorException(
        'No se pudo completar el registro debido a un error interno.',
      );
    }
  }

  //login email y pass
  //@Res({ passthrough: true }) res: Response,para poder enviar la cookie con el refresh token al cliente, y el passthrough permite que el controlador siga manejando la respuesta después de establecer la cookie, en lugar de hacerlo manual
  async login(loginDto: LoginDto, res: Response) {
    const { email, password } = loginDto;
    try {
      //1. Buscar el usuario por email, asegurándonos de que esté activo y verificado, y traer también las credenciales para verificar la contraseña
      const user = await this.prisma.user.findUnique({
        where: { email: email },
        select: {
          id: true,
          email: true,
          isActive: true,
          isVerified: true,
          userName: true,
          authCredentials: {
            where: { provider: 'LOCAL' },
            select: { passwordHash: true },
          }, // Asegúrate de incluir las credenciales para verificar la contraseña
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException('Usuario no encontrado.');
      }

      const cred = user?.authCredentials?.[0]; // Obtener las credenciales del proveedor local

      if (!cred || !cred.passwordHash) {
        throw new UnauthorizedException(
          'No se encontraron credenciales para este usuario.',
        );
      }

      if (!user.isActive || !user.isVerified) {
        //no dar información específica para evitar dar pistas a posibles atacantes
        throw new UnauthorizedException('Usuario no autorizado.');
      }

      const match = await bcrypt.compare(password, cred.passwordHash);

      if (!match) {
        throw new UnauthorizedException('Contraseña incorrecta.');
      }

      //obtener el access token y el refresh token
      const { accessToken, refreshToken } = await this.getTokens(
        user.id,
        user.email,
      );

      //guardar el refresh token hasheado en la base de datos y crear una sesión para el usuario
      await this.saveRefreshToken(user.id, refreshToken);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true, // Solo accesible por el servidor
        secure: process.env.NODE_ENV === 'production', //true, // Solo se envía en conexiones HTTPS
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none', //'strict', // Evita que se envíe en solicitudes cross-site
        path: '/', // La cookie estará disponible en toda la aplicación
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });

      return {
        accessToken,
        email: user.email,
        userName: user.userName,
        firstName: user.profile?.firstName,
        lastName: user.profile?.lastName,
      };
    } catch (error) {
      // Si ya es una excepción HTTP (401, 403, etc.), la dejás pasar tal cual
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(
        'mensaje',
        error instanceof Error ? error.message : String(error),
      ); //console.error('Error al iniciar sesión:', error);
      throw new InternalServerErrorException('No se pudo completar el login.');
    }
  }

  //MEtodo para cerrar sesion, eliminar el refresh token de la base de datos y eliminar la cookie del cliente ;  @Res({ passthrough: true }) res: Response, lo quite del servicio y lo deje solo en el controlador para que el servicio no dependa de la respuesta HTTP, y asi poder reutilizar la lógica de cierre de sesión en otros contextos si es necesario (ej: logout global desde un microservicio de notificaciones)
  async logout(userId: string, res: Response, refreshToken: string) {
    try {
      if (!userId) {
        throw new UnauthorizedException('Usuario no autenticado.');
      }

      // 1. Traes todas las sesiones activas del usuario
      const sessions = await this.prisma.userSession.findMany({
        where: {
          userId,
          isRevoked: false,
        },
      });

      // 2. Buscas cuál sesión corresponde al refreshToken enviado
      let targetSession: UserSession | null = null;

      for (const session of sessions) {
        const matches = await bcrypt.compare(
          refreshToken,
          session.refreshTokenHash,
        );
        if (matches) {
          targetSession = session;
          break;
        }
      }

      if (!targetSession) {
        throw new NotFoundException('Sesión no encontrada o ya cerrada.');
      }

      // inhabilitar el refresh token en la base de datos (en lugar de eliminarlo, lo marcamos como revocado)
      await this.prisma.userSession.update({
        where: { id: targetSession.id },
        data: { isRevoked: true, revokedAt: new Date() }, // Puedes agregar un campo para marcar cuándo se revocó el token
      });

      //Limpiar la cookie del refresh token en el cliente
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
      });

      return { message: 'Sesión cerrada exitosamente.' };
    } catch (error) {
      // Si ya es una excepción HTTP (401, 404, etc.), la dejamos pasar
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(
        'mensaje',
        error instanceof Error ? error.message : String(error),
      ); //console.error('Error al eliminar el token refresh:', error);
      throw new InternalServerErrorException(
        'No se pudo completar el cierre de sesión debido a un error interno.',
      );
    }
  }

  //Metodo para refrescar el access token usando el refresh token, se llama desde el endpoint /refresh-token
  async refreshToken(refreshToken: string, res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Token de refresco no proporcionado.');
    }

    // 1. Verificar firma primero, obtener payload ya confiable
    let payload: { sub: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      console.error(
        'mensaje',
        error instanceof Error ? error.message : String(error),
      ); //console.error('Error al verificar el token de refresco:', error);
      throw new UnauthorizedException('Token de refresco expirado o inválido.');
    }

    const userId = payload.sub;

    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    let targetSession: UserSession | null = null;

    for (const session of sessions) {
      // 3. Comparar token con hash guardado
      const matches = await bcrypt.compare(
        refreshToken,
        session.refreshTokenHash,
      );
      if (matches) {
        targetSession = session;
        break;
      }
    }

    if (!targetSession) {
      // Aquí sí es robo real — ninguna sesión activa coincidió
      await this.prisma.userSession.updateMany({
        where: { userId },
        data: { isRevoked: true, revokedAt: new Date() },
      });
      throw new UnauthorizedException(
        'Token inválido. Todas las sesiones han sido cerradas.',
      );
    }

    // 4. Generar nuevos tokens (rotación)
    const { accessToken, refreshToken: newRefreshToken } = await this.getTokens(
      userId,
      payload.email,
    );

    //NUEVO ENFOQUE
    // Verificar si la sesión es reciente (menos de 15 minutos)
    const sessionAge = Date.now() - targetSession.createdAt.getTime();
    const fifteenMinutes = 15 * 60 * 1000;

    if (sessionAge < fifteenMinutes) {
      // Sesión recién creada → solo actualizar el hash sin cambiar expiresAt
      await this.prisma.userSession.update({
        where: { id: targetSession.id },
        data: {
          refreshTokenHash: await bcrypt.hash(newRefreshToken, 10),
        },
      });
    } else {
      // Sesión más antigua → actualizar hash y renovar expiración
      await this.prisma.userSession.update({
        where: { id: targetSession.id },
        data: {
          refreshTokenHash: await bcrypt.hash(newRefreshToken, 10),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }

    // 6. Obtener datos del usuario (fuera de la transacción)
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        userName: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // 6. Setear nueva cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      accessToken,
      email: payload.email,
      firstName: user?.profile?.firstName,
      lastName: user?.profile?.lastName,
      userName: user?.userName,
      //avatarUrl: profile?.avatarUrl,
    };
  }

  //Metodo par reenviar el mail de verificacion
  async resendEmailVerification(email: string) {
    const verificationToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const genericResponse = {
      message:
        'Si el email está registrado, te enviamos un correo de verificación.',
    };
    let user: { email: string; userName: string };
    try {
      user = await this.prisma.user.update({
        where: { email },
        data: {
          verificationToken,
          verificationTokenExpiresAt: expiresAt,
        },
        select: {
          email: true,
          userName: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        console.log(`Intento de reenvío para email no registrado: ${email}`);
        return genericResponse; // respuesta genérica, no enumeramos usuarios
      }
      console.error(
        'mensaje',
        error instanceof Error ? error.message : String(error),
      ); //console.error('Error al actualizar token de verificación:', error);
      throw error;
    }

    try {
      await this.mailService.sendVerificationEmail(
        user.email,
        verificationToken,
        user.userName,
      );
    } catch (emailError) {
      console.error(
        'mensaje',
        emailError instanceof Error ? emailError.message : String(emailError),
      ); //console.error('Error al enviar email de verificación:', emailError);
    }

    return genericResponse;
  }

  //metodo para verificar el email del usuario, se llama desde el endpoint /verify-email?token=xxxx
  async verifyEmail(token: string) {
    if (!token) {
      throw new UnauthorizedException(
        'Token de verificación no proporcionado.',
      );
    }
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          verificationToken: token,
          verificationTokenExpiresAt: { gt: new Date() },
        },
      });
      if (!user) {
        throw new UnauthorizedException(
          'Token de verificación inválido o expirado.',
        );
      }
      // Actualizar el estado del usuario a verificado
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken: null,
          verificationTokenExpiresAt: null,
          isVerified: true,
          isActive: true, // Puedes activar el usuario automáticamente al verificar el email, o dejarlo para que un admin lo active manualmente según tu lógica de negocio
        },
      });
      return { message: 'Correo electrónico verificado exitosamente.' };
    } catch (error) {
      console.error(
        'mensaje',
        error instanceof Error ? error.message : String(error),
      ); //console.error('Error al verificar el correo electrónico:', error);
      throw new InternalServerErrorException(
        'No se pudo verificar el correo electrónico debido a un error interno.',
      );
    }
  }

  //metodo para buscar por email a un user
  async findByEmail(email: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { email: email },
        select: {
          id: true,
          email: true,
          userName: true,
          isActive: true,
          isVerified: true,
          profile: { select: { firstName: true, lastName: true } },
          //buscar todas las credenciales
          authCredentials: { select: { provider: true } },
        },
      });

      return user;
    } catch (err) {
      // Si ya es una excepción HTTP (401, 403, etc.), la dejás pasar tal cual
      if (err instanceof HttpException) {
        throw err;
      }
      console.error(
        'mensaje',
        err instanceof Error ? err.message : String(err),
      ); //console.log(err);
      throw new InternalServerErrorException('No se pudo completar el login.');
    }
  }

  //metodo para buscar por username a un user
  //Retorna el user completo, pero no lo uso, si quisiera cambiar el return, hacerlo sin problemas
  async findByUsername(userName: string) {
    try {
      const user = await this.prisma.user.findFirst({
        where: { userName },
        /*select: {
          id: true,
          email: true,
          userName: true,
          isActive: true,
          isVerified: true,
          profile: { select: { firstName: true, lastName: true } },
          //buscar todas las credenciales
          authCredentials: { select: { provider: true } },
        },*/
      });

      return user;
    } catch (err) {
      // Si ya es una excepción HTTP (401, 403, etc.), la dejás pasar tal cual
      if (err instanceof HttpException) {
        throw err;
      }
      console.log(err);
      throw new InternalServerErrorException('No se pudo completar el login.');
    }
  }

  //-------------------- OAUTH ---------------------------------
  //crear username aleatorio y unico
  generateUsername = (email: string): string => {
    const base = email.split('@')[0]; // parte antes del @
    const random = Math.floor(Math.random() * 9000) + 1000; // 4 dígitos aleatorios
    return `${base}_${random}`; // ej: juan.perez_4823
  };

  private async generateUniqueUsername(email: string): Promise<string> {
    let userName: string = '';
    let exists = true;

    while (exists) {
      userName = this.generateUsername(email);
      const user = await this.prisma.user.findUnique({
        where: { userName },
        select: { id: true },
      });
      exists = !!user;
    }

    return userName;
  }

  //login oauth
  async loginOauth(loginProps: LoginOAuth, res: Response) {
    const { userId, email, userName, firstName, lastName } = loginProps;
    try {
      //obtener el access token y el refresh token
      const { accessToken, refreshToken } = await this.getTokens(userId, email);

      //guardar el refresh token hasheado en la base de datos y crear una sesión para el usuario
      await this.saveRefreshToken(userId, refreshToken);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true, // Solo accesible por el servidor
        secure: process.env.NODE_ENV === 'production', //true, // Solo se envía en conexiones HTTPS
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', //'none',//'strict', // Evita que se envíe en solicitudes cross-site
        path: '/', // La cookie estará disponible en toda la aplicación
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });

      return {
        accessToken,
        email: email,
        userName: userName,
        firstName: firstName,
        lastName: lastName,
      };
    } catch (error) {
      // Si ya es una excepción HTTP (401, 403, etc.), la dejás pasar tal cual
      if (error instanceof HttpException) {
        throw error;
      }
      console.error(
        'mensaje',
        error instanceof Error ? error.message : String(error),
      ); //console.error('Error al iniciar sesión:', error);
      throw new InternalServerErrorException('No se pudo completar el login.');
    }
  }

  //metodo registro con red social
  async registerOAuth(oAuthUser: RegisterOAuthDto) {
    const {
      email,
      userName,
      firstName,
      lastName,
      provider,
      provider_account_id,
    } = oAuthUser;

    try {
      // Aquí puedes agregar lógica para validar el username y password
      const user = await this.prisma.user.create({
        data: {
          email,
          userName: userName,
          verificationToken: null, //verificationToken,
          verificationTokenExpiresAt: null, //expiresAt,
          //EVALUAR SI SEGUI DEJANDO ASI O ENVAIR IGUALMENTE EL EMAIL DE VERIFICACION
          isActive: true,
          isVerified: true,
          profile: {
            create: {
              firstName: firstName,
              lastName: lastName,
            },
          },
          authCredentials: {
            create: [
              {
                //passwordHash: hashedPassword,
                provider: provider, // Puedes ajustar esto según tu lógica de proveedores
                providerAccountId: provider_account_id,
              },
            ],
          },
        },
        select: {
          id: true,
          email: true,
          userName: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      console.error(
        'mensaje',
        error instanceof Error ? error.message : String(error),
      ); //console.error('Error al registrar usuario:', error);
      // Manejo de errores específicos de Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Este código de error indica una violación de unicidad
          throw new ConflictException(
            'El usuario con este correo electrónico o nombre de usuario ya existe.',
          );
        }
      }
      // 5. Manejo de errores desconocidos o internos (HTTP 500)
      throw new InternalServerErrorException(
        'No se pudo completar el registro debido a un error interno.',
      );
    }
  }

  //metodo de validacion de google
  //opcion 1 crea al user e inicia sesion
  //opcion 2 inicia sesion
  async validateOAuthUser(userOAuth: RegisterOAuthDto) {
    try {
      const user = await this.findByEmail(userOAuth.email);
      // si no existe, se genera un username ya que viene vacio de googlestrategy y se crea el user
      if (!user) {
        const existUserName = await this.findByUsername(userOAuth.userName);
        //Compruebo si contiene username o si ya existe en la base de datos, si es asi genero uno nuevo
        if (!userOAuth.userName || existUserName)
          userOAuth.userName = await this.generateUniqueUsername(
            userOAuth.email,
          );
        const newUser = await this.registerOAuth(userOAuth);
        return newUser; //[newUser, userOAuth.userName];
      }

      //Si el user existe, pero esta bloqueado, no se le permite iniciar sesion
      if (!user.isActive && user.isVerified) {
        throw new UnauthorizedException('Usuario bloquado temporalmente.');
      }

      //BUSCAR SI LA CREDENCIAL DEL OAUTH EXISTE
      const hasOAuth = user.authCredentials.some(
        (c) =>
          c.provider.toLowerCase().trim() ===
          userOAuth.provider.toLowerCase().trim(),
      );
      if (hasOAuth) return user;

      //SI NO, CREARLA
      await this.prisma.authCredential.create({
        data: {
          provider: userOAuth.provider,
          providerAccountId: userOAuth.provider_account_id,
          userId: user.id,
        },
      });

      if (!user.isVerified) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            isVerified: true,
            isActive: true,
          },
        });
      }

      return user;
    } catch (e) {
      // Si ya es una excepción HTTP (401, 403, etc.), la dejás pasar tal cual
      if (e instanceof HttpException) {
        throw e;
      }
      console.error('mensaje', e instanceof Error ? e.message : String(e)); //console.error('Error al iniciar sesión:', e);
      throw new InternalServerErrorException('No se pudo completar el login.');
    }
  }
}
