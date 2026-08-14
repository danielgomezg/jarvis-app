import { Controller, Get } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';

@ApiTags('profile')
@Controller('profile/')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener el perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario obtenido exitosamente.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token JWT inválido o ausente.',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  getProfile(@AuthUser() user: UserPayload) {
    return this.profileService.getProfile(user.authId);
  }
}
