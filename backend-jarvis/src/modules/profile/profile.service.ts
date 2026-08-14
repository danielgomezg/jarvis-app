import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  //Metodo para obtener el perfil del usuario autenticado
  async getProfile(userId: string) {
    try {
      if (!userId) {
        throw new NotFoundException('ID de usuario no proporcionado');
      }
      const profile = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!profile) {
        throw new NotFoundException('Perfil no encontrado');
      }

      return profile;
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
      throw new InternalServerErrorException(
        'No se pudo obtener el perfil del usuario',
      );
    }
  }
}
