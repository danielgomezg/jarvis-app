import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProfileService } from './profile.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto/updated-profile.dto';

// ─────────────────────────────────────────────────────────────────────────
// COMO LEER ESTE ARCHIVO
// ─────────────────────────────────────────────────────────────────────────
// ProfileService es el "cerebro" del perfil: leer el perfil del usuario
// autenticado (getProfile) y actualizarlo (updateProfile, que toca dos
// tablas: User para el userName y Profile para el resto).
//
// Prisma está MOCKEADO (fingido), así el test prueba SOLO la lógica del
// servicio: qué exceptions lanza y qué llamadas hace a la base de datos.
//
// Cada `it()` sigue el patrón AAA:
//   Arrange -> preparamos qué devuelven los mocks (escenario).
//   Act     -> ejecutamos el método real que queremos probar.
//   Assert  -> verificamos el resultado con `expect(...)`.
//
// Comandos para correr los tests (desde backend-jarvis/):
//   pnpm run test                -> todos
//   pnpm run test -- profile.service -> solo este archivo
//   pnpm run test -- -t "P2002"  -> solo los tests con "P2002" en el nombre
// ─────────────────────────────────────────────────────────────────────────

// select idéntico que usa el servicio real en getProfile y updateProfile
const profileSelect = {
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
};

const profileFromDb = {
  firstName: 'Juan',
  lastName: 'Perez',
  avatarUrl: null,
  gender: null,
  phone: null,
  birthDate: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  defaultServings: 1,
  dietaryPreferences: [],
  allergenWarnings: [],
};

describe('ProfileService', () => {
  let service: ProfileService;

  const prisma = {
    user: {
      update: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    // $transaction recibe una función callback y la ejecuta con "tx".
    // Nuestro mock simplemente ejecuta esa función pasándole los mocks
    // mismos (así tx.user.update === prisma.user.update en los tests).
    $transaction: jest.fn((fn: (tx: typeof prisma) => unknown): unknown =>
      fn(prisma),
    ),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    // Silenciamos los console.error del servicio en los tests de errores
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfileService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ───────────────────────────────────────────────────────────────────────
  // getProfile(userId): busca el perfil por userId con un select fijo
  // (nunca devuelve password ni datos sensibles).
  // ───────────────────────────────────────────────────────────────────────
  describe('getProfile', () => {
    it('debe devolver el perfil cuando existe', async () => {
      prisma.profile.findUnique.mockResolvedValue(profileFromDb);

      const result = await service.getProfile('user-1');

      expect(prisma.profile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        select: profileSelect,
      });
      expect(result).toEqual(profileFromDb);
    });

    it('debe lanzar NotFoundException si el userId está vacío', async () => {
      await expect(service.getProfile('')).rejects.toThrow(
        new NotFoundException('ID de usuario no proporcionado'),
      );
      // No llegó a tocar la base de datos
      expect(prisma.profile.findUnique).not.toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el perfil no existe', async () => {
      prisma.profile.findUnique.mockResolvedValue(null);

      await expect(service.getProfile('user-inexistente')).rejects.toThrow(
        new NotFoundException('Perfil no encontrado'),
      );
    });

    it('debe relanzar la HttpException original en vez de envolverla en 500', async () => {
      prisma.profile.findUnique.mockRejectedValue(
        new NotFoundException('excepción de prueba'),
      );

      await expect(service.getProfile('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debe lanzar InternalServerErrorException en error inesperado de DB', async () => {
      prisma.profile.findUnique.mockRejectedValue(new Error('db down'));

      await expect(service.getProfile('user-1')).rejects.toThrow(
        new InternalServerErrorException(
          'No se pudo obtener el perfil del usuario',
        ),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // updateProfile(userId, dto): usa $transaction porque toca DOS tablas:
  //   1) User   -> actualiza userName (lo más probable que falle: unique)
  //   2) Profile -> actualiza el resto de los campos
  // Si dto solo trae userName, no toca Profile (solo lee y devuelve).
  // ───────────────────────────────────────────────────────────────────────
  describe('updateProfile', () => {
    it('debe lanzar NotFoundException si el userId está vacío', async () => {
      await expect(
        service.updateProfile('', { userName: 'juan' }),
      ).rejects.toThrow(
        new NotFoundException('ID de usuario no proporcionado'),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el dto está vacío', async () => {
      await expect(service.updateProfile('user-1', {})).rejects.toThrow(
        new BadRequestException('Datos de actualización no proporcionados'),
      );
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('debe actualizar User y Profile dentro de una transacción', async () => {
      const dto: UpdateProfileDto = {
        userName: 'nuevouser',
        firstName: 'Juan',
        birthDate: '1990-01-01',
      };
      prisma.profile.update.mockResolvedValue(profileFromDb);

      const result = await service.updateProfile('user-1', dto);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { userName: 'nuevouser' },
      });
      expect(prisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          // birthDate "1990-01-01" se convierte a Date a medianoche UTC
          data: {
            firstName: 'Juan',
            birthDate: new Date('1990-01-01T00:00:00.000Z'),
          },
        }),
      );
      expect(result).toEqual(profileFromDb);
    });

    it('debe convertir birthDate ausente en null al actualizar el perfil', async () => {
      // Comportamiento actual: aunque no envíes birthDate, el servicio
      // escribe null en ese campo del perfil.
      const dto: UpdateProfileDto = {
        userName: 'nuevouser',
        defaultServings: 2,
      };
      prisma.profile.update.mockResolvedValue(profileFromDb);

      await service.updateProfile('user-1', dto);

      expect(prisma.profile.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { defaultServings: 2, birthDate: null },
        }),
      );
    });

    it('debe devolver el perfil sin tocar Profile cuando solo cambia userName', async () => {
      prisma.profile.findUnique.mockResolvedValue(profileFromDb);

      const result = await service.updateProfile('user-1', {
        userName: 'solousername',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { userName: 'solousername' },
      });
      expect(prisma.profile.update).not.toHaveBeenCalled();
      expect(prisma.profile.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
      expect(result).toEqual(profileFromDb);
    });

    it('debe lanzar ConflictException si Prisma devuelve P2002 (userName duplicado)', async () => {
      prisma.user.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('unique', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.updateProfile('user-1', { userName: 'ocupado' }),
      ).rejects.toThrow(
        new ConflictException('El nombre de usuario ya está en uso.'),
      );
    });

    it('debe relanzar la HttpException original en vez de envolverla en 500', async () => {
      prisma.user.update.mockRejectedValue(
        new NotFoundException('excepción de prueba'),
      );

      await expect(
        service.updateProfile('user-1', { userName: 'juan' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe lanzar InternalServerErrorException en error inesperado de DB', async () => {
      prisma.user.update.mockRejectedValue(new Error('db down'));

      await expect(
        service.updateProfile('user-1', { userName: 'juan' }),
      ).rejects.toThrow(
        new InternalServerErrorException(
          'No se pudo actualizar el perfil del usuario',
        ),
      );
    });
  });
});
