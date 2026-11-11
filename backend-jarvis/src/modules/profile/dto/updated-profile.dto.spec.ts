import { validate, ValidationError } from 'class-validator';
import { UpdateProfileDto } from './updated-profile.dto';

// ─────────────────────────────────────────────────────────────────────────
// COMO LEER ESTE ARCHIVO
// ─────────────────────────────────────────────────────────────────────────
// Este test no toca NestJS ni la base de datos: solo comprueba que las
// reglas del DTO (los decoradores @IsString, @MinLength, etc.) hacen su
// trabajo. El ValidationPipe global de NestJS usa estas mismas reglas
// antes de que el controller reciba la petición.
//
// validate() devuelve una lista de errores de class-validator; de ahí
// extraemos los mensajes en español que definimos en el DTO.
// ─────────────────────────────────────────────────────────────────────────

// Crea una instancia del DTO con los campos que queramos (el resto queda
// como undefined, que class-validator trata como "no enviado")
const buildDto = (partial: Partial<UpdateProfileDto>): UpdateProfileDto => {
  const dto = new UpdateProfileDto();
  Object.assign(dto, partial);
  return dto;
};

// Aplana los errores -> ["El nombre de usuario es obligatorio.", ...]
const messagesOf = (errors: ValidationError[]): string[] =>
  errors.flatMap((error) => Object.values(error.constraints ?? {}));

// Genera n strings únicos y válidos (para probar el límite de 25 items)
const manyItems = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `item${index}`);

describe('UpdateProfileDto', () => {
  // ───────────────────────────────────────────────────────────────────────
  // userName (obligatorio)
  // ───────────────────────────────────────────────────────────────────────
  describe('userName', () => {
    it('debe pasar un dto completo válido', async () => {
      const errors = await validate(
        buildDto({
          userName: 'juanperez',
          firstName: 'Juan',
          lastName: 'Perez',
          phone: '+14155552671',
          gender: 'Masculino',
          birthDate: '1990-01-01',
          defaultServings: 2,
          dietaryPreferences: ['Vegetariano', 'Sin gluten'],
          allergenWarnings: ['Nueces', 'Lactosa'],
        }),
      );

      expect(errors).toHaveLength(0);
    });

    it('debe pasar un dto mínimo con solo userName', async () => {
      const errors = await validate(buildDto({ userName: 'juanperez' }));

      expect(errors).toHaveLength(0);
    });

    it('debe fallar si falta userName', async () => {
      const errors = await validate(buildDto({ firstName: 'Juan' }));

      expect(messagesOf(errors)).toContain(
        'El nombre de usuario es obligatorio.',
      );
    });

    it('debe fallar si userName tiene 1 carácter', async () => {
      const errors = await validate(buildDto({ userName: 'j' }));

      expect(messagesOf(errors)).toContain(
        'El nombre de usuario debe tener al menos 2 caracteres.',
      );
    });

    it('debe fallar si userName supera los 50 caracteres', async () => {
      const errors = await validate(buildDto({ userName: 'a'.repeat(51) }));

      expect(messagesOf(errors)).toContain(
        'El nombre de usuario no puede superar los 50 caracteres.',
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Campos opcionales (si no llegan, no fallan; si llegan mal, fallan)
  // ───────────────────────────────────────────────────────────────────────
  describe('campos opcionales', () => {
    it('debe aceptar phone null y birthDate null (el frontend los limpia así)', async () => {
      const errors = await validate(
        buildDto({ userName: 'juanperez', phone: null, birthDate: null }),
      );

      expect(errors).toHaveLength(0);
    });

    it('debe fallar si el phone no es un número válido', async () => {
      const errors = await validate(
        buildDto({ userName: 'juanperez', phone: '123-abc' }),
      );

      expect(messagesOf(errors)).toContain(
        'El teléfono debe ser un número de teléfono válido.',
      );
    });

    it('debe aceptar un phone en formato internacional válido', async () => {
      const errors = await validate(
        buildDto({ userName: 'juanperez', phone: '+14155552671' }),
      );

      expect(errors).toHaveLength(0);
    });

    it('debe fallar si birthDate no es una fecha válida', async () => {
      const errors = await validate(
        buildDto({ userName: 'juanperez', birthDate: 'ayer' }),
      );

      expect(messagesOf(errors)).toContain(
        'La fecha de nacimiento debe ser una fecha válida.',
      );
    });

    it('debe aceptar birthDate en formato YYYY-MM-DD', async () => {
      const errors = await validate(
        buildDto({ userName: 'juanperez', birthDate: '1990-01-01' }),
      );

      expect(errors).toHaveLength(0);
    });

    it('debe fallar si firstName tiene 1 carácter', async () => {
      const errors = await validate(
        buildDto({ userName: 'juanperez', firstName: 'J' }),
      );

      expect(messagesOf(errors)).toContain(
        'El nombre debe tener al menos 2 caracteres.',
      );
    });

    it('debe fallar si defaultServings es 0 (mínimo 1)', async () => {
      const errors = await validate(
        buildDto({ userName: 'juanperez', defaultServings: 0 }),
      );

      expect(messagesOf(errors)).toContain(
        'Las porciones por defecto debe ser al menos 1.',
      );
    });

    it('debe fallar si defaultServings no es un entero', async () => {
      const errors = await validate(
        buildDto({ userName: 'juanperez', defaultServings: 2.5 }),
      );

      expect(messagesOf(errors)).toContain(
        'Las porciones por defecto debe ser un número entero.',
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────
  // Arrays: dietaryPreferences y allergenWarnings (mismas reglas)
  // ───────────────────────────────────────────────────────────────────────
  describe('arrays de preferencias y alérgenos', () => {
    it('debe aceptar 25 items (el máximo permitido)', async () => {
      const errors = await validate(
        buildDto({
          userName: 'juanperez',
          dietaryPreferences: manyItems(25),
          allergenWarnings: manyItems(25),
        }),
      );

      expect(errors).toHaveLength(0);
    });

    it('debe fallar con 26 items en dietaryPreferences', async () => {
      const errors = await validate(
        buildDto({
          userName: 'juanperez',
          dietaryPreferences: manyItems(26),
        }),
      );

      expect(messagesOf(errors)).toContain(
        'No se pueden tener más de 25 preferencias dietéticas.',
      );
    });

    it('debe fallar con items repetidos en dietaryPreferences', async () => {
      // Ojo: ArrayUnique compara exactamente, así que "Vegetariano" y
      // "vegetariano" el backend los ve como distintos. Evitar duplicados
      // con distinta mayúscula/tilde es tarea del frontend (normalize).
      const errors = await validate(
        buildDto({
          userName: 'juanperez',
          dietaryPreferences: ['Vegetariano', 'Vegetariano'],
        }),
      );

      expect(messagesOf(errors)).toContain(
        'Las preferencias dietéticas deben ser únicas.',
      );
    });

    it('debe fallar si un item del array tiene 1 carácter', async () => {
      const errors = await validate(
        buildDto({
          userName: 'juanperez',
          allergenWarnings: ['Nueces', 'a'],
        }),
      );

      expect(messagesOf(errors)).toContain(
        'Cada advertencia de alergia debe tener al menos 2 caracteres.',
      );
    });

    it('debe fallar si un item del array supera los 50 caracteres', async () => {
      const errors = await validate(
        buildDto({
          userName: 'juanperez',
          dietaryPreferences: ['a'.repeat(51)],
        }),
      );

      expect(messagesOf(errors)).toContain(
        'Cada preferencia dietética no puede superar los 50 caracteres.',
      );
    });

    it('debe fallar con items repetidos en allergenWarnings', async () => {
      const errors = await validate(
        buildDto({
          userName: 'juanperez',
          allergenWarnings: ['Nueces', 'Nueces'],
        }),
      );

      expect(messagesOf(errors)).toContain(
        'Las advertencias de alergia deben ser únicas.',
      );
    });
  });
});
