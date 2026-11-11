import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import type { UserPayload } from '../auth/interfaces/user-payload.interface';
import { UpdateProfileDto } from './dto/updated-profile.dto';

// ─────────────────────────────────────────────────────────────────────────
// COMO LEER ESTE ARCHIVO
// ─────────────────────────────────────────────────────────────────────────
// El ProfileController es una "receptionista" muy delgada: solo recibe la
// petición HTTP y DELEGA todo en ProfileService. El decorator @AuthUser()
// inyecta el usuario decodificado del JWT, y de ahí sacamos user.authId.
//
// Por eso estos tests solo comprueban UNA cosa: que el controller le pasa
// los datos correctos al servicio (authId y DTO). La lógica real vive en
// profile.service.spec.ts.
// ─────────────────────────────────────────────────────────────────────────

describe('ProfileController', () => {
  let controller: ProfileController;

  const profileService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  // Lo que normalmente inyecta el decorator @AuthUser() (ya decodificado
  // del JWT por el backend). authId es el ID de la tabla auth_credential.
  const user: UserPayload = {
    authId: 'auth-1',
    email: 'juan@mail.com',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: profileService }],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  describe('getProfile', () => {
    it('debe delegar en ProfileService.getProfile con el authId del usuario', async () => {
      profileService.getProfile.mockResolvedValue({ firstName: 'Juan' });

      const result = await controller.getProfile(user);

      expect(profileService.getProfile).toHaveBeenCalledWith('auth-1');
      expect(result).toEqual({ firstName: 'Juan' });
    });
  });

  describe('updateProfile', () => {
    it('debe delegar en ProfileService.updateProfile con el authId y el DTO', async () => {
      const dto: UpdateProfileDto = {
        userName: 'nuevouser',
        firstName: 'Juan',
      };
      profileService.updateProfile.mockResolvedValue({ firstName: 'Juan' });

      const result = await controller.updateProfile(user, dto);

      expect(profileService.updateProfile).toHaveBeenCalledWith('auth-1', dto);
      expect(result).toEqual({ firstName: 'Juan' });
    });
  });
});
