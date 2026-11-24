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
          user: {
            select: { userName: true },
          },
        },
      });

      if (!profile) {
        throw new NotFoundException('Perfil no encontrado');
      }

      const { user, ...profileData } = profile;
      return { ...profileData, userName: user.userName };
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

      const { userName, birthDate, ...profileData } = dto;

      // Los @Transform del DTO crean las claves aunque no vengan en el JSON,
      // así que "vacío" se detecta por VALORES, no por cantidad de claves.
      const definedEntries = Object.entries(profileData).filter(
        ([, value]) => value !== undefined,
      );
      const hasProfileChanges =
        definedEntries.length > 0 || birthDate !== undefined;

      if (userName === undefined && !hasProfileChanges) {
        throw new BadRequestException(
          'Datos de actualización no proporcionados',
        );
      }

      const profileUpdate = Object.fromEntries(
        definedEntries,
      ) as Prisma.ProfileUpdateInput;
      // const profileUpdate: Prisma.ProfileUpdateInput = { ...profileData };

      // Gracias al DTO, aquí solo llegará un string con fecha válida o null/undefined
      if (birthDate !== undefined)
        profileUpdate.birthDate = birthDate
          ? new Date(`${birthDate}T00:00:00.000Z`)
          : null;

      //  Validación de fecha futura
      if (birthDate) {
        const fecha = new Date(`${birthDate}T00:00:00.000Z`);
        if (fecha.getTime() > Date.now()) {
          throw new BadRequestException(
            'La fecha de nacimiento no puede ser futura.',
          );
        }
      }

      /*const newProfileData = {
        ...profileData,
        
        birthDate: profileData.birthDate
          ? new Date(`${profileData.birthDate}T00:00:00.000Z`)
          : null,
      };*/

      // Transaccion condicional para actualizar el perfil
      await this.prisma.$transaction(async (tx) => {
        if (userName !== undefined) {
          await tx.user.update({ where: { id: userId }, data: { userName } });
        }
        if (Object.keys(profileUpdate).length > 0) {
          await tx.profile.update({ where: { userId }, data: profileUpdate });
        }
      });

      const result = await this.prisma.profile.findUnique({
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
          user: { select: { userName: true } },
        },
      });

      if (!result) throw new NotFoundException('Perfil no encontrado');

      const { user, ...rest } = result;
      return { ...rest, userName: user.userName };

      /*const updatedProfile = await this.prisma.$transaction(async (tx) => {
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
      });*/
      //return updatedProfile;
    } catch (error) {
      //console.error('Error al actualizar el perfil:', error);

      // Si ya es una excepción HTTP (401, 403, etc.), la dejás pasar tal cual
      if (error instanceof HttpException) {
        throw error;
      }
      // Mapeo de error Perfil no encontrado
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Perfil no encontrado');
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
