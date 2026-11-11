import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { useUpdateProfile } from '@/hooks/profile/useUpdateProfile'
import { ProfileService } from '@/services/profile/profile.service'
import type {
  Profile,
  UpdateProfilePayload,
} from '@/types/profile/profile.types'

// ─────────────────────────────────────────────────────────────────────────
// TEST — useUpdateProfile
// ─────────────────────────────────────────────────────────────────────────
// El hook usa useMutation y, al terminar con éxito, invalida la query
// ["profile"] para que se vuelva a pedir el perfil.
//
// Probamos:
//   - estado inicial (isIdle)
//   - mutación exitosa + invalidación de la caché
//   - errores (mensaje del backend / error de conexión)
// ─────────────────────────────────────────────────────────────────────────

vi.mock('axios', () => ({
  default: { isAxiosError: vi.fn() },
}))

vi.mock('@/services/profile/profile.service', () => ({
  ProfileService: {
    me: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

const profileFixture = {
  firstName: 'Juan',
  lastName: 'Perez',
  avatarUrl: null,
  gender: undefined,
  phone: null,
  birthDate: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  defaultServings: 3,
  dietaryPreferences: ['vegetariano'],
  allergenWarnings: ['nueces'],
} as unknown as Profile

const payload: UpdateProfilePayload = {
  userName: 'nuevouser',
  firstName: 'Juan',
  defaultServings: 3,
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  return { wrapper, queryClient }
}

const mockUpdateResolved = (profile: Profile) => {
  vi.mocked(ProfileService.updateProfile).mockResolvedValue({
    data: profile,
  } as unknown as AxiosResponse<Profile>)
}

describe('useUpdateProfile', () => {
  beforeEach(() => {
    vi.mocked(axios.isAxiosError).mockReset()
  })

  it('empieza en estado idle', () => {
    const { wrapper } = createWrapper()
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    expect(result.current.isIdle).toBe(true)
    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeNull()
  })

  it('actualiza el perfil e invalida la query ["profile"]', async () => {
    mockUpdateResolved(profileFixture)
    const { wrapper, queryClient } = createWrapper()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    act(() => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(ProfileService.updateProfile).toHaveBeenCalledWith(payload)
    expect(result.current.data).toEqual(profileFixture)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile'] })
  })

  it('expone el mensaje del backend cuando la actualización falla', async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(true)
    vi.mocked(ProfileService.updateProfile).mockRejectedValue({
      response: { data: { message: 'El nombre de usuario ya está en uso.' } },
    })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    act(() => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe(
      'El nombre de usuario ya está en uso.',
    )
    expect(result.current.isSuccess).toBe(false)
  })

  it('muestra un error de conexión si el error no es de Axios', async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(false)
    vi.mocked(ProfileService.updateProfile).mockRejectedValue(
      new Error('db down'),
    )
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    act(() => {
      result.current.mutate(payload)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error?.message).toBe(
      'Error de conexión. Intenta nuevamente.',
    )
  })
})
