import { describe, it, expect } from 'vitest'
import { profileSchema } from '@/schemas/profile/profile-schema'

// ─────────────────────────────────────────────────────────────────────────
// PRIMER TEST — Validación del formulario de perfil (Zod)
// ─────────────────────────────────────────────────────────────────────────
// Este archivo NO renderiza componentes: prueba solo las reglas del schema
// que usa el formulario de /profile. Es el test más seguro para arrancar
// porque no depende del DOM ni de la API.
//
// Patrón AAA en cada test:
//   Arrange → preparamos los datos
//   Act     → ejecutamos profileSchema.safeParse(...)
//   Assert  → comprobamos si pasa o qué mensaje de error devuelve
//
// `safeParse` nunca lanza: devuelve { success: true, data } o
// { success: false, error }. Usamos eso para no depender de try/catch.
// ─────────────────────────────────────────────────────────────────────────

// Datos mínimos que el schema exige: userName, firstName, lastName y
// defaultServings (el resto de campos son opcionales).
const validProfile = {
  userName: 'juanperez',
  firstName: 'Juan',
  lastName: 'Perez',
  defaultServings: 2,
}

// Devuelve el primer mensaje de error de un parse fallido.
const firstMessage = (result: ReturnType<typeof profileSchema.safeParse>) => {
  if (result.success) return null
  return result.error.issues[0]?.message ?? null
}

describe('profileSchema', () => {
  it('acepta un perfil mínimo válido', () => {
    const result = profileSchema.safeParse(validProfile)

    expect(result.success).toBe(true)
  })

  it('acepta un perfil completo válido', () => {
    const result = profileSchema.safeParse({
      ...validProfile,
      phone: '+14155552671',
      birthDate: new Date('1990-01-01'),
      gender: 'Masculino',
      dietaryPreferences: ['Vegetariano'],
      allergenWarnings: ['Nueces'],
    })

    expect(result.success).toBe(true)
  })

  describe('userName', () => {
    it('rechaza menos de 4 caracteres', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        userName: 'jua',
      })

      expect(result.success).toBe(false)
      expect(firstMessage(result)).toBe(
        'El nombre de usuario debe tener al menos 4 caracteres',
      )
    })

    it('rechaza más de 64 caracteres', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        userName: 'a'.repeat(65),
      })

      expect(result.success).toBe(false)
      expect(firstMessage(result)).toBe(
        'El nombre de usuario debe tener máximos 64 caracteres',
      )
    })
  })

  describe('phone', () => {
    it('normaliza un teléfono sin "+" agregándolo', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        phone: '14155552671',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.phone).toBe('+14155552671')
      }
    })

    it('convierte un teléfono vacío en undefined', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        phone: '',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.phone).toBeUndefined()
      }
    })

    it('rechaza un teléfono inválido', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        phone: '123',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('birthDate', () => {
    it('rechaza un string en lugar de un Date', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        birthDate: '1990-01-01',
      })

      expect(result.success).toBe(false)
    })
  })

  describe('defaultServings', () => {
    it('rechaza 0 (mínimo 1)', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        defaultServings: 0,
      })

      expect(result.success).toBe(false)
      expect(firstMessage(result)).toBe('La racion mimina es 1')
    })

    it('rechaza más de 1000', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        defaultServings: 1001,
      })

      expect(result.success).toBe(false)
      expect(firstMessage(result)).toBe('La racion maxima es 1000')
    })
  })

  describe('dietaryPreferences', () => {
    it('normaliza cada preferencia a minúsculas', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        dietaryPreferences: ['VEGETARIANO', 'Sin Gluten'],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.dietaryPreferences).toEqual([
          'vegetariano',
          'sin gluten',
        ])
      }
    })

    it('rechaza un item de 1 carácter', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        dietaryPreferences: ['a'],
      })

      expect(result.success).toBe(false)
      expect(firstMessage(result)).toBe(
        'Cada preferencia dietética debe tener al menos 2 caracteres',
      )
    })

    it('rechaza más de 25 items', () => {
      const items = Array.from({ length: 26 }, (_, i) => `item${i}`)
      const result = profileSchema.safeParse({
        ...validProfile,
        dietaryPreferences: items,
      })

      expect(result.success).toBe(false)
      expect(firstMessage(result)).toBe(
        'No puedes seleccionar más de 25 preferencias dietéticas',
      )
    })
  })

  describe('allergenWarnings', () => {
    it('normaliza cada advertencia a minúsculas', () => {
      const result = profileSchema.safeParse({
        ...validProfile,
        allergenWarnings: ['NUECES'],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.allergenWarnings).toEqual(['nueces'])
      }
    })

    it('rechaza más de 25 items', () => {
      const items = Array.from({ length: 26 }, (_, i) => `item${i}`)
      const result = profileSchema.safeParse({
        ...validProfile,
        allergenWarnings: items,
      })

      expect(result.success).toBe(false)
      expect(firstMessage(result)).toBe(
        'No puedes seleccionar más de 25 advertencias de alérgenos',
      )
    })
  })
})
