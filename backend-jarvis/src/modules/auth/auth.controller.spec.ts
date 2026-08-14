import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginOAuth } from './interfaces/loginOAuth.interface';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    verifyEmail: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    resendEmailVerification: jest.fn(),
    loginOauth: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  const res = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
  } as unknown as Response;

  const reqWithCookie = {
    cookies: { refreshToken: 'refresh-token' },
  } as unknown as Request;

  describe('register', () => {
    it('debe delegar en AuthService.register con el DTO', async () => {
      const dto = {
        firstName: 'Juan',
        lastName: 'Perez',
        userName: 'juanperez',
        email: 'juan@mail.com',
        password: 'Password123',
      };
      authService.register.mockResolvedValue({ email: dto.email });

      const result = await controller.register(dto);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual({ email: dto.email });
    });
  });

  describe('verifyEmail', () => {
    it('debe delegar en AuthService.verifyEmail con el token', async () => {
      authService.verifyEmail.mockResolvedValue({ message: 'ok' });

      const result = await controller.verifyEmail('token-abc');

      expect(authService.verifyEmail).toHaveBeenCalledWith('token-abc');
      expect(result).toEqual({ message: 'ok' });
    });
  });

  describe('login', () => {
    it('debe delegar en AuthService.login con DTO y respuesta', async () => {
      const dto = { email: 'juan@mail.com', password: 'Password123' };
      authService.login.mockResolvedValue({ accessToken: 'at' });

      const result = await controller.login(dto, res);

      expect(authService.login).toHaveBeenCalledWith(dto, res);
      expect(result).toEqual({ accessToken: 'at' });
    });
  });

  describe('refresh', () => {
    it('debe lanzar UnauthorizedException si no hay cookie refreshToken', async () => {
      const reqWithoutCookie = {
        cookies: {},
      } as unknown as Request;

      await expect(controller.refresh(reqWithoutCookie, res)).rejects.toThrow(
        new UnauthorizedException('No se proporcionó un refresh token.'),
      );
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('debe delegar en AuthService.refreshToken con el token de la cookie', async () => {
      authService.refreshToken.mockResolvedValue({ accessToken: 'at' });

      const result = await controller.refresh(reqWithCookie, res);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'refresh-token',
        res,
      );
      expect(result).toEqual({ accessToken: 'at' });
    });
  });

  describe('logout', () => {
    const user = { authId: 'user-1', email: 'juan@mail.com' };

    it('debe lanzar UnauthorizedException si no hay cookie refreshToken', async () => {
      const reqWithoutCookie = {
        cookies: {},
      } as unknown as Request;

      await expect(
        controller.logout(reqWithoutCookie, res, user),
      ).rejects.toThrow(
        new UnauthorizedException('No se proporcionó un refresh token.'),
      );
    });

    it('debe delegar en AuthService.logout con authId y token', async () => {
      authService.logout.mockResolvedValue({ message: 'Sesión cerrada' });

      const result = await controller.logout(reqWithCookie, res, user);

      expect(authService.logout).toHaveBeenCalledWith(
        'user-1',
        res,
        'refresh-token',
      );
      expect(result).toEqual({ message: 'Sesión cerrada' });
    });
  });

  describe('resendVerification', () => {
    it('debe delegar en AuthService.resendEmailVerification con el email', async () => {
      authService.resendEmailVerification.mockResolvedValue({
        message: 'enviado',
      });

      const result = await controller.resendVerification({
        email: 'juan@mail.com',
      });

      expect(authService.resendEmailVerification).toHaveBeenCalledWith(
        'juan@mail.com',
      );
      expect(result).toEqual({ message: 'enviado' });
    });
  });

  describe('googleCallback / githubCallback', () => {
    const oauthUser: LoginOAuth = {
      userId: 'user-1',
      email: 'juan@mail.com',
      userName: 'juanperez',
      firstName: 'Juan',
      lastName: 'Perez',
      provider: 'GOOGLE',
      provider_account_id: 'google-123',
    };

    beforeEach(() => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
    });

    it('debe lanzar UnauthorizedException si no hay usuario en el request', async () => {
      const reqNoUser = { cookies: {} } as unknown as Request;

      await expect(controller.googleCallback(reqNoUser, res)).rejects.toThrow(
        new UnauthorizedException('Usuario no encontrado.'),
      );
      await expect(controller.githubCallback(reqNoUser, res)).rejects.toThrow(
        new UnauthorizedException('Usuario no encontrado.'),
      );
    });

    it('google: debe loguear al usuario y redirigir a /oauth-success', async () => {
      const reqWithUser = {
        cookies: {},
        user: oauthUser,
      } as unknown as Request;
      authService.loginOauth.mockResolvedValue({ accessToken: 'at' });

      await controller.googleCallback(reqWithUser, res);

      expect(authService.loginOauth).toHaveBeenCalledWith(oauthUser, res);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/oauth-success',
      );
    });

    it('github: debe loguear al usuario y redirigir a /oauth-success', async () => {
      const reqWithUser = {
        cookies: {},
        user: { ...oauthUser, provider: 'GITHUB' },
      } as unknown as Request;
      authService.loginOauth.mockResolvedValue({ accessToken: 'at' });

      await controller.githubCallback(reqWithUser, res);

      expect(authService.loginOauth).toHaveBeenCalledWith(
        { ...oauthUser, provider: 'GITHUB' },
        res,
      );
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/oauth-success',
      );
    });
  });
});
