import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import type { AxiosResponse } from 'axios'
import axios from 'axios'
import { parseISO, addMinutes } from 'date-fns'
import { useGetProfile } from '@/hooks/profile/useGetProfile'
import { ProfileService } from '@/services/profile/profile.service'
import type { Profile } from '@/types/profile/profile.types'

// ─────────────────────────────────────────────────────────────────────────
// TEST — useGetProfile
// ─────────────────────────────────────────────────────────────────────────
// El hook usa useQuery(["profile"]) y delega el HTTP en ProfileService.
// Aquí mockeamos ProfileService (no la red) y montamos un QueryClient real
// con retry: false para que los errores aparezcan de inmediato.
//
// axios se mockea solo para controlar isAxiosError(), que el hook usa para
// decidir qué mensaje mostrar.
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
  defaultServings: 2,
  dietaryPreferences: ['vegetariano'],
  allergenWarnings: ['nueces'],
} as unknown as Profile

// Crea un wrapper con su propio QueryClient para cada test.
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

const mockMeResolved = (profile: Profile) => {
  vi.mocked(ProfileService.me).mockResolvedValue({
    data: profile,
  } as unknown as AxiosResponse<Profile>)
}

describe('useGetProfile', () => {
  beforeEach(() => {
    vi.mocked(axios.isAxiosError).mockReset()
  })

  it('empieza en estado de carga y luego expone el perfil', async () => {
    mockMeResolved(profileFixture)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useGetProfile(), { wrapper })

    // Primer render: React Query está pidiendo los datos.
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(ProfileService.me).toHaveBeenCalledTimes(1)
    expect(result.current.profile).toEqual(profileFixture)
    expect(result.current.success).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('convierte birthDate de string a Date ajustando la zona horaria', async () => {
    const birthDate = '1990-01-01T00:00:00.000Z'
    mockMeResolved({ ...profileFixture, birthDate } as unknown as Profile)
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useGetProfile(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    const parsed = parseISO(birthDate)
    const expected = addMinutes(parsed, parsed.getTimezoneOffset())

    expect(result.current.profile?.birthDate).toBeInstanceOf(Date)
    expect(result.current.profile?.birthDate).toEqual(expected)
  })

  it('usa el mensaje del backend cuando la API responde con error', async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(true)
    vi.mocked(ProfileService.me).mockRejectedValue({
      response: { data: { message: 'Perfil no encontrado' } },
    })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useGetProfile(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Perfil no encontrado')
    expect(result.current.success).toBe(false)
  })

  it('usa el mensaje por defecto si el error de Axios no trae message', async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(true)
    vi.mocked(ProfileService.me).mockRejectedValue({
      response: { data: {} },
    })
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useGetProfile(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Error al obtener el perfil.')
  })

  it('muestra un error de conexión si el error no es de Axios', async () => {
    vi.mocked(axios.isAxiosError).mockReturnValue(false)
    vi.mocked(ProfileService.me).mockRejectedValue(new Error('db down'))
    const { wrapper } = createWrapper()

    const { result } = renderHook(() => useGetProfile(), { wrapper })

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe(
      'Error de conexión. Intenta nuevamente.',
    )
  })
})
