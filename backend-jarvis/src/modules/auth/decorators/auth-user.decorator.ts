import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// 1. Importa el tipo Request de Express
// Este decorador extrae el objeto de usuario (authId, email, profileId) que Passport inyecta en req.user tras validar el JWT
export const AuthUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // 2. Le indicamos a TypeScript que el request sigue la interfaz de Express
    const request = ctx.switchToHttp().getRequest<Request>();

    // 3. Retornamos el objeto user (puedes añadir un fallback por si acaso)
    return request.user;
  },
);

//ejemplo de uso en un controlador:
/*import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator'; // Ajusta la ruta
import { UserPayload } from '../auth/interfaces/user-payload.interface'; // Ajusta la ruta

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('/info')
  @ApiOperation({ summary: 'Obtiene la información del perfil del usuario autenticado.' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  getProfile(@AuthUser() user: UserPayload) {
    // Con 'user.authId' tienes acceso directo al ID validado por tu base de datos y token
    return this.profileService.getProfile(user.authId);
  }
}*/
