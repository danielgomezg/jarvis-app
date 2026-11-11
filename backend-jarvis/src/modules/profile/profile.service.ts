import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  HttpException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/updated-profile.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) {}

  //Metodo para obtener el perfil del usuario autenticado
  async getProfile(userId: string) {
    try {
      if (!userId) {
        throw new NotFoundException('ID de usuario no proporcionado');
      }
      const profile = await this.prisma.profile.findUnique({
        where: {
          userId: userId,
        },
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
          gender: true,
          phone: true,
          birthDate: true,
          createdAt: true,
          defaultServings: true,
          dietaryPreferences: true,
          allergenWarnings: true,
        },
      });

      if (!profile) {
        throw new NotFoundException('Perfil no encontrado');
      }

      return profile;
    } catch (error) {
      console.error('Error al obtener el perfil:', error);
      // Si ya es una excepción HTTP (401, 403, etc.), la dejás pasar tal cual
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'No se pudo obtener el perfil del usuario',
      );
    }
  }

  // 2. Actualizar datos personales
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    try {
      if (!userId) {
        throw new NotFoundException('ID de usuario no proporcionado');
      }

      if (!dto || Object.keys(dto).length === 0) {
        throw new BadRequestException(
          'Datos de actualización no proporcionados',
        );
      }

      const { userName, ...profileData } = dto;

      const newProfileData = {
        ...profileData,
        // Gracias al DTO, aquí solo llegará un string con fecha válida o null/undefined
        birthDate: profileData.birthDate
          ? new Date(`${profileData.birthDate}T00:00:00.000Z`)
          : null,
      };

      const updatedProfile = await this.prisma.$transaction(async (tx) => {
        // 1ro: User (el unique es lo más probable que falle → 409 temprano)
        await tx.user.update({
          where: { id: userId },
          data: { userName },
        });

        // 2do: Profile solo si hay campos de perfil
        if (Object.keys(profileData).length > 0) {
          return await tx.profile.update({
            where: { userId },
            data: newProfileData,
            select: {
              firstName: true,
              lastName: true,
              avatarUrl: true,
              gender: true,
              phone: true,
              birthDate: true,
              createdAt: true,
              defaultServings: true,
              dietaryPreferences: true,
              allergenWarnings: true,
            },
          });
        }

        // Solo cambió userName → devolvemos el perfil tal cual está
        return await tx.profile.findUnique({
          where: { userId },
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            gender: true,
            phone: true,
            birthDate: true,
            createdAt: true,
            defaultServings: true,
            dietaryPreferences: true,
            allergenWarnings: true,
          },
        });
      });

      return updatedProfile;
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);

      // Si ya es una excepción HTTP (401, 403, etc.), la dejás pasar tal cual
      if (error instanceof HttpException) {
        throw error;
      }

      // Username tomado por otro usuario
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('El nombre de usuario ya está en uso.');
      }
      throw new InternalServerErrorException(
        'No se pudo actualizar el perfil del usuario',
      );
    }
  }

  // 3. Reemplazar preferencias dietéticas
  //async updateDietaryPreferences(userId: string, preferences: string[]){}

  // 4. Reemplazar advertencias de alérgenos
  //async updateAllergenWarnings(userId: string, warnings: string[]);

  // 5. (Opcional) Agregar una preferencia sin reemplazar todo
  //async addDietaryPreference(userId: string, preference: string);

  // 6. (Opcional) Eliminar una preferencia específica
  /*async removeDietaryPreference(userId: string, preference: string)
Para los arrays: Prisma soporta push y filters para arrays de Postgres:
// Agregar un item:
await this.prisma.profile.update({
  where: { userId },
  data: { dietaryPreferences: { push: 'vegetariano' } },
});

// Eliminar un item (requiere filtrar):
const profile = await this.prisma.profile.findUnique({ where: { userId } });
const updated = profile.dietaryPreferences.filter(p => p !== 'vegetariano');
await this.prisma.profile.update({
  where: { userId },
  data: { dietaryPreferences: updated },
});
*/
}
