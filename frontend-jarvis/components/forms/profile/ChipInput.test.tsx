import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import ChipInput from '@/components/forms/profile/ChipInput'
import type { ProfileFormData } from '@/schemas/profile/profile-schema'
import { toast } from 'sonner'

// ─────────────────────────────────────────────────────────────────────────
// TEST — ChipInput (preferencias dietéticas / alérgenos)
// ─────────────────────────────────────────────────────────────────────────
// ChipInput no guarda estado propio: usa react-hook-form (Controller +
// useWatch) para el array y recibe el texto del input por props (value /
// setValue), igual que en la página de perfil.
//
// Por eso el test monta un "harness": un componente pequeño con un useForm
// real y un useState para el texto. Así probamos el componente tal como se
// usa en producción, sin mocks de react-hook-form.
//
// Mockeamos `sonner` porque addChip muestra un toast al llegar al máximo.
// ─────────────────────────────────────────────────────────────────────────

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}))

interface HarnessProps {
  editing?: boolean
  initial?: string[]
  listSuggestions?: string[]
  removePreference?: (
    nameArray: 'dietaryPreferences' | 'allergenWarnings',
    value: string,
  ) => void
}

function Harness({
  editing = true,
  initial = [],
  listSuggestions,
  removePreference = () => {},
}: HarnessProps) {
  const { control, watch } = useForm<ProfileFormData>({
    defaultValues: { dietaryPreferences: initial },
  })
  const [value, setValue] = useState('')

  // watch() fuerza un re-render cuando cambia el array del formulario.
  const current = watch('dietaryPreferences') ?? []

  return (
    <>
      <ChipInput
        editing={editing}
        control={control}
        value={value}
        setValue={setValue}
        nameArray="dietaryPreferences"
        removePreference={removePreference}
        listSuggestions={listSuggestions}
        placeholder="Ej: vegetariano, keto..."
      />
      {/* Salida de test: el array real que tiene el formulario. */}
      <output data-testid="array">{JSON.stringify(current)}</output>
    </>
  )
}

// Lee el array actual desde la salida del harness.
const currentArray = (): string[] =>
  JSON.parse(screen.getByTestId('array').textContent ?? '[]') as string[]

// El input de texto de ChipInput (el único con ese placeholder).
const getInput = () =>
  screen.getByPlaceholderText('Ej: vegetariano, keto...')

describe('ChipInput', () => {
  beforeEach(() => {
    vi.mocked(toast.error).mockClear()
  })

  // ───────────────────────────────────────────────────────────────────────
  // Modo lectura (editing = false)
  // ───────────────────────────────────────────────────────────────────────
  describe('modo lectura', () => {
    it('muestra los chips con la primera letra en mayúscula', () => {
      render(<Harness editing={false} initial={['vegetariano', 'sin gluten']} />)

      expect(screen.getByText('Vegetariano')).toBeInTheDocument()
      expect(screen.getByText('Sin gluten')).toBeInTheDocument()
    })

    it('muestra "Sin configurar" cuando no hay elementos', () => {
      render(<Harness editing={false} initial={[]} />)

      expect(screen.getByText('Sin configurar')).toBeInTheDocument()
    })
  })

  // ───────────────────────────────────────────────────────────────────────
  // Agregar (editing = true)
  // ───────────────────────────────────────────────────────────────────────
  describe('agregar', () => {
    it('agrega un chip al presionar Enter y limpia el input', async () => {
      const user = userEvent.setup()
      render(<Harness initial={[]} />)

      await user.type(getInput(), 'Keto{Enter}')

      expect(currentArray()).toEqual(['keto'])
      expect(getInput()).toHaveValue('')
    })

    it('agrega un chip al hacer clic en el botón +', async () => {
      const user = userEvent.setup()
      render(<Harness initial={[]} />)

      const input = getInput()
      await user.type(input, 'Keto')

      // El botón + está en la misma fila que el input.
      const row = input.parentElement as HTMLElement
      await user.click(within(row).getByRole('button'))

      expect(currentArray()).toEqual(['keto'])
    })

    it('no agrega nada si el texto tiene menos de 2 caracteres', async () => {
      const user = userEvent.setup()
      render(<Harness initial={[]} />)

      // El botón + está deshabilitado con 1 carácter.
      const input = getInput()
      await user.type(input, 'k')
      const row = input.parentElement as HTMLElement
      expect(within(row).getByRole('button')).toBeDisabled()

      await user.type(input, '{Enter}')
      expect(currentArray()).toEqual([])
    })
  })

  // ───────────────────────────────────────────────────────────────────────
  // Duplicados y límite
  // ───────────────────────────────────────────────────────────────────────
  describe('validaciones', () => {
    it('no agrega un duplicado aunque cambie mayúsculas/espacios', async () => {
      const user = userEvent.setup()
      render(<Harness initial={['vegetariano']} />)

      await user.type(getInput(), '  VEGETARIANO  {Enter}')

      expect(currentArray()).toEqual(['vegetariano'])
    })

    it('no supera el máximo de 25 items y avisa con un toast', async () => {
      const user = userEvent.setup()
      const initial = Array.from({ length: 25 }, (_, index) => `item${index}`)
      render(<Harness initial={initial} />)

      await user.type(getInput(), 'nuevo{Enter}')

      expect(currentArray()).toHaveLength(25)
      expect(toast.error).toHaveBeenCalledWith('Solo se pueden añadir 25 items')
    })
  })

  // ───────────────────────────────────────────────────────────────────────
  // Eliminar
  // ───────────────────────────────────────────────────────────────────────
  describe('eliminar', () => {
    it('llama a removePreference con el nombre del array y el valor', async () => {
      const user = userEvent.setup()
      const removePreference = vi.fn()
      render(
        <Harness
          initial={['vegetariano', 'keto']}
          removePreference={removePreference}
        />,
      )

      // Cada chip tiene un botón X dentro de su <span>.
      const chip = screen.getByText('Vegetariano').closest('span') as HTMLElement
      await user.click(within(chip).getByRole('button'))

      expect(removePreference).toHaveBeenCalledWith(
        'dietaryPreferences',
        'vegetariano',
      )
    })
  })

  // ───────────────────────────────────────────────────────────────────────
  // Sugerencias (Popover)
  // ───────────────────────────────────────────────────────────────────────
  describe('sugerencias', () => {
    it('filtra por texto y agrega al hacer clic en una sugerencia', async () => {
      const user = userEvent.setup()
      render(
        <Harness
          initial={[]}
          listSuggestions={['vegetariano', 'keto', 'sin gluten']}
        />,
      )

      // Al escribir "ket" solo debe quedar "keto".
      await user.type(getInput(), 'ket')

      const suggestion = await screen.findByRole('button', { name: 'keto' })
      expect(
        screen.queryByRole('button', { name: 'sin gluten' }),
      ).not.toBeInTheDocument()

      await user.click(suggestion)

      expect(currentArray()).toEqual(['keto'])
    })
  })
})
