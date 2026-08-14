import {
  Body,
  Post,
  Controller,
  HttpCode,
  Res,
  Req,
  UnauthorizedException,
  Query,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ResendVerificationDto } from './dto/resendVerification.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { AuthUser } from './decorators/auth-user.decorator';
import type { UserPayload } from './interfaces/user-payload.interface';
import { Throttle } from '@nestjs/throttler';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth/github-auth.guard';
import { LoginOAuth } from './interfaces/loginOAuth.interface';

@ApiTags('auth')
@Controller('auth/')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public() // Esta ruta será pública, no requerirá JWT
  @Throttle({ default: { ttl: 60000, limit: 3 } }) // 3 registros por minuto
  @HttpCode(201)
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de registro inválidos.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('verify-email')
  @Public()
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: 'Verificar el correo electrónico del usuario' })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Token de verificación enviado al email',
  })
  @ApiResponse({ status: 200, description: 'Correo verificado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado.' })
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  @Public() // Esta ruta también es pública
  @Throttle({ default: { ttl: 60000, limit: 100 } }) // 10 intentos por minuto cambiar a 5 por minuto si es necesario
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesión y obtener un token JWT' })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión exitoso, token JWT devuelto.',
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(loginDto, res);
  }

  @Post('refresh')
  @Public() // El refresh token también se envía sin JWT
  @Throttle({
    short: { ttl: 60000, limit: 15 }, //cambio a 5
    long: { ttl: 3600000, limit: 30 }, //  a 20
  })
  @HttpCode(200)
  @ApiOperation({ summary: 'Refrescar el token JWT usando el refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token JWT refrescado exitosamente.',
  })
  @ApiResponse({ status: 401, description: 'Refresh token inválido.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // const refreshTokenCurrent: string = req.cookies['refreshToken'];
    const refreshTokenCurrent = (req.cookies as Record<string, string>)?.[
      'refreshToken'
    ];
    //console.log('HOLA ', refreshTokenCurrent);
    if (!refreshTokenCurrent) {
      throw new UnauthorizedException('No se proporcionó un refresh token.');
    }
    return this.authService.refreshToken(refreshTokenCurrent, res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión y eliminar el refresh token' })
  @ApiResponse({ status: 200, description: 'Cierre de sesión exitoso.' })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @AuthUser() user: UserPayload,
  ) {
    const refreshTokenCurrent = (req.cookies as Record<string, string>)?.[
      'refreshToken'
    ];
    if (!refreshTokenCurrent) {
      throw new UnauthorizedException('No se proporcionó un refresh token.');
    }
    return this.authService.logout(user.authId, res, refreshTokenCurrent);
  }

  @Post('resend-verification')
  @ApiOperation({ summary: 'Reenvia el mail de verificacion' })
  @ApiResponse({ status: 200, description: 'Email enviado con exito' })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor al procesar la solicitud',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiadas solicitudes, intenta nuevamente más tarde',
  })
  @Throttle({
    short: { ttl: 60000, limit: 3 },
    long: { ttl: 3600000, limit: 5 },
  })
  @Public()
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return this.authService.resendEmailVerification(
      resendVerificationDto.email,
    );
  }

  @Get('google')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 100 } }) // 10 intentos por minuto cambiar a 5 por minuto si es necesario
  async googleLogin() {}

  @Get('google/callback')
  @Public()
  @UseGuards(GoogleAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 100 } }) // 10 intentos por minuto cambiar a 5 por minuto si es necesario
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as LoginOAuth;

    if (!user) throw new UnauthorizedException('Usuario no encontrado.');
    await this.authService.loginOauth(user, res);
    res.redirect(`${process.env.FRONTEND_URL}/oauth-success`);
  }

  @Get('github')
  @Public()
  @UseGuards(GithubAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 100 } }) // 10 intentos por minuto cambiar a 5 por minuto si es necesario
  async githubLogin() {}

  @Get('github/callback')
  @Public()
  @UseGuards(GithubAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 100 } }) // 10 intentos por minuto cambiar a 5 por minuto si es necesario
  async githubCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user as LoginOAuth;
    if (!user) throw new UnauthorizedException('Usuario no encontrado.');
    await this.authService.loginOauth(user, res);
    res.redirect(`${process.env.FRONTEND_URL}/oauth-success`);
  }
}
