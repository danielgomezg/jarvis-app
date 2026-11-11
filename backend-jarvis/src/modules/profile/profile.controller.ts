import { Controller, Get, Patch, Body } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';
import { UpdateProfileDto } from './dto/updated-profile.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('profile')
@Controller('profile/')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  @Throttle({ default: { ttl: 60000, limit: 10000 } })
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

  // Actualizar datos personales
  @Patch('me')
  @ApiOperation({ summary: 'Actualizar el perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario actualizado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud incorrecta. Datos de entrada inválidos.',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado. Token JWT inválido o ausente.',
  })
  @ApiResponse({ status: 500, description: 'Error interno del servidor.' })
  updateProfile(@AuthUser() user: UserPayload, @Body() dto: UpdateProfileDto) {
    return this.profileService.updateProfile(user.authId, dto);
  }

  //@Patch('me/dietary') // Actualizar preferencias dietéticas
  //@Patch('me/allergens') // Actualizar advertencias de alérgenos
}
