import { describe, it, expect, vi } from 'vitest'
import type { AxiosResponse } from 'axios'
import { ProfileService } from '@/services/profile/profile.service'
import { apiPrivate } from '@/lib/api'
import type {
  Profile,
  UpdateProfilePayload,
} from '@/types/profile/profile.types'

// ─────────────────────────────────────────────────────────────────────────
// TEST — ProfileService
// ─────────────────────────────────────────────────────────────────────────
// El service es una capa muy fina sobre Axios: solo define las URLs y el
// método HTTP. Aquí mockeamos `apiPrivate` (la instancia de Axios privada)
// para comprobar que:
//   - GET  /profile/me  (me)
//   - PATCH /profile/me (updateProfile)
// y que devuelve la respuesta tal cual, sin transformarla.
// ─────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/api', () => ({
  apiPrivate: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}))

const profileResponse = {
  data: {
    firstName: 'Juan',
    lastName: 'Perez',
    avatarUrl: null,
    gender: undefined,
    phone: null,
    birthDate: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    defaultServings: 2,
    dietaryPreferences: ['vegetariano'],
    allergenWarnings: ['nueces'],
  } as unknown as Profile,
} as unknown as AxiosResponse<Profile>

const payload: UpdateProfilePayload = {
  userName: 'nuevouser',
  firstName: 'Juan',
  defaultServings: 3,
}

describe('ProfileService', () => {
  describe('me', () => {
    it('hace GET /profile/me y devuelve la respuesta', async () => {
      vi.mocked(apiPrivate.get).mockResolvedValue(profileResponse)

      const result = await ProfileService.me()

      expect(apiPrivate.get).toHaveBeenCalledWith('/profile/me', {})
      expect(apiPrivate.get).toHaveBeenCalledTimes(1)
      expect(result).toBe(profileResponse)
    })

    it('propaga el error de Axios', async () => {
      vi.mocked(apiPrivate.get).mockRejectedValue(new Error('network down'))

      await expect(ProfileService.me()).rejects.toThrow('network down')
    })
  })

  describe('updateProfile', () => {
    it('hace PATCH /profile/me con el payload y devuelve la respuesta', async () => {
      vi.mocked(apiPrivate.patch).mockResolvedValue(profileResponse)

      const result = await ProfileService.updateProfile(payload)

      expect(apiPrivate.patch).toHaveBeenCalledWith('/profile/me', payload)
      expect(apiPrivate.patch).toHaveBeenCalledTimes(1)
      expect(result).toBe(profileResponse)
    })

    it('propaga el error de Axios', async () => {
      vi.mocked(apiPrivate.patch).mockRejectedValue(new Error('conflict'))

      await expect(ProfileService.updateProfile(payload)).rejects.toThrow(
        'conflict',
      )
    })
  })
})
