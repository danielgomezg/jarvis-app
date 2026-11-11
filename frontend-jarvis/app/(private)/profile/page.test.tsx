import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfilePage from '@/app/(private)/profile/page'
import type { Profile } from '@/types/profile/profile.types'
import type { UpdateProfilePayload } from '@/types/profile/profile.types'

// ─────────────────────────────────────────────────────────────────────────
// TEST — Página /profile (integración de UI)
// ─────────────────────────────────────────────────────────────────────────
// Renderizamos la página REAL con sus componentes reales, pero mockeamos
// las fronteras externas:
//   - useGetProfile / useUpdateProfile (datos y mutación)
//   - useAuthStore (usuario de sesión)
//   - sonner (toasts)
//   - next/image (no hay avatar en la fixture, pero evitamos cargar Next)
//
// Así el test se centra en lo que hace la página: pintar el perfil, entrar
// en modo edición, construir el payload correcto y reaccionar al éxito/error.
// ─────────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => ({
  useGetProfile: vi.fn(),
  useUpdateProfile: vi.fn(),
  useAuthStore: vi.fn(),
  mutate: vi.fn(),
  setUser: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('@/hooks/profile/useGetProfile', () => ({
  useGetProfile: mocks.useGetProfile,
}))

vi.mock('@/hooks/profile/useUpdateProfile', () => ({
  useUpdateProfile: mocks.useUpdateProfile,
}))

vi.mock('@/store/auth.store', () => ({
  useAuthStore: mocks.useAuthStore,
}))

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}))

vi.mock('next/image', () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img {...props} alt={props.alt ?? ''} />
  ),
}))

const AUTH_USER = {
  userName: 'juanperez',
  email: 'juan@mail.com',
}

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  firstName: 'Juan',
  lastName: 'Perez',
  avatarUrl: null,
  gender: 'Masculino',
  phone: '+14155552671',
  birthDate: new Date('1990-01-01T00:00:00.000Z'),
  createdAt: '2026-01-01T00:00:00.000Z',
  defaultServings: 2,
  dietaryPreferences: ['vegetariano'],
  allergenWarnings: ['nueces'],
  ...overrides,
})

interface MutateOptions {
  onSuccess?: () => void
  onError?: (error: unknown) => void
}

// Deja los mocks en un escenario "perfil cargado, guardado exitoso".
const setupDefaults = (profile: Profile = makeProfile()) => {
  mocks.useGetProfile.mockReturnValue({
    profile,
    loading: false,
    error: null,
    success: true,
  })
  mocks.useUpdateProfile.mockReturnValue({
    mutate: mocks.mutate,
    isPending: false,
    error: null,
  })
  mocks.useAuthStore.mockReturnValue({
    user: AUTH_USER,
    setUser: mocks.setUser,
  })
  // Por defecto, mutate ejecuta onSuccess (como haría React Query).
  mocks.mutate.mockImplementation(
    (_payload: UpdateProfilePayload, options?: MutateOptions) => {
      options?.onSuccess?.()
    },
  )
}

describe('ProfilePage', () => {
  beforeEach(() => {
    // La página llama a console.error dentro de onError; lo silenciamos.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    setupDefaults()
  })

  // ───────────────────────────────────────────────────────────────────────
  // Estados de la query
  // ───────────────────────────────────────────────────────────────────────
  it('muestra el estado de carga', () => {
    mocks.useGetProfile.mockReturnValue({
      profile: null,
      loading: true,
      error: null,
      success: false,
    })

    render(<ProfilePage />)

    expect(screen.getByText('Cargando perfil...')).toBeInTheDocument()
  })

  it('muestra el estado de error', () => {
    mocks.useGetProfile.mockReturnValue({
      profile: null,
      loading: false,
      error: 'Perfil no encontrado',
      success: false,
    })

    render(<ProfilePage />)

    expect(screen.getByText('Error: Perfil no encontrado')).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────
  // Render del perfil
  // ───────────────────────────────────────────────────────────────────────
  it('muestra los datos del perfil y las preferencias', () => {
    const profile = makeProfile()
    setupDefaults(profile)

    render(<ProfilePage />)

    expect(screen.getByText('Juan Perez')).toBeInTheDocument()
    expect(screen.getByText('@juanperez')).toBeInTheDocument()

    const memberSince = new Date(profile.createdAt).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    expect(
      screen.getByText(`Miembro desde ${memberSince}`),
    ).toBeInTheDocument()

    // Chips en modo lectura
    expect(screen.getByText('Vegetariano')).toBeInTheDocument()
    expect(screen.getByText('Nueces')).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────
  // Modo edición
  // ───────────────────────────────────────────────────────────────────────
  it('entra en modo edición al hacer clic en "Editar perfil"', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /Editar perfil/ }))

    expect(screen.getByRole('button', { name: /Guardar/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancelar/ })).toBeInTheDocument()
  })

  it('cancela la edición y restaura los valores originales', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /Editar perfil/ }))

    const firstName = screen.getByDisplayValue('Juan')
    await user.clear(firstName)
    await user.type(firstName, 'Carlos')
    expect(firstName).toHaveValue('Carlos')

    await user.click(screen.getByRole('button', { name: /Cancelar/ }))

    expect(
      screen.getByRole('button', { name: /Editar perfil/ }),
    ).toBeInTheDocument()
    expect(screen.getByDisplayValue('Juan')).toBeInTheDocument()
  })

  // ───────────────────────────────────────────────────────────────────────
  // Guardar
  // ───────────────────────────────────────────────────────────────────────
  it('envía el payload correcto al guardar', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /Editar perfil/ }))

    const firstName = screen.getByDisplayValue('Juan')
    await user.clear(firstName)
    await user.type(firstName, 'Carlos')

    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() => expect(mocks.mutate).toHaveBeenCalledTimes(1))

    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        userName: 'juanperez',
        firstName: 'Carlos',
        lastName: 'Perez',
        phone: '+14155552671',
        gender: 'Masculino',
        // Date -> "YYYY-MM-DD"
        birthDate: '1990-01-01',
        defaultServings: 2,
        dietaryPreferences: ['vegetariano'],
        allergenWarnings: ['nueces'],
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    )
  })

  it('al guardar con éxito sale de edición y muestra un toast', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /Editar perfil/ }))

    const firstName = screen.getByDisplayValue('Juan')
    await user.clear(firstName)
    await user.type(firstName, 'Carlos')

    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() =>
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        'Perfil Actualizado con correctamente.',
      ),
    )
    expect(
      screen.getByRole('button', { name: /Editar perfil/ }),
    ).toBeInTheDocument()
  })

  it('sincroniza el userName en el store si cambió', async () => {
    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /Editar perfil/ }))

    const userName = screen.getByDisplayValue('juanperez')
    await user.clear(userName)
    await user.type(userName, 'nuevouser')

    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() =>
      expect(mocks.setUser).toHaveBeenCalledWith(
        expect.objectContaining({ userName: 'nuevouser' }),
      ),
    )
  })

  it('muestra un toast de error si el guardado falla', async () => {
    mocks.mutate.mockImplementation(
      (_payload: UpdateProfilePayload, options?: MutateOptions) => {
        options?.onError?.(new Error('boom'))
      },
    )

    const user = userEvent.setup()
    render(<ProfilePage />)

    await user.click(screen.getByRole('button', { name: /Editar perfil/ }))

    const firstName = screen.getByDisplayValue('Juan')
    await user.clear(firstName)
    await user.type(firstName, 'Carlos')

    await user.click(screen.getByRole('button', { name: /Guardar/ }))

    await waitFor(() =>
      expect(mocks.toastError).toHaveBeenCalledWith(
        'Error al actualizar el perfil',
      ),
    )
  })
})
