import { z } from "zod";

export const profileSchema = z.object({
  userName: z
    .string()
    .min(4, "El nombre de usuario debe tener al menos 4 caracteres")
    .max(64, "El nombre de usuario debe tener máximos 64 caracteres"),
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(64, "El nombre debe tener máximos 64 caracteres"),
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(64, "El apellido debe tener máximos 64 caracteres"),
  //phone: z.e164().optional(), //ejemplo +15555555555; cadenas con un carácter inicial +, un código de país distinto de cero, de entre 7 y 15 dígitos.
  phone: z
    .string()
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      return value.startsWith("+") ? value : `+${value}`;
    })
    .pipe(z.e164().optional()),
  birthDate: z.date().optional(),
  gender: z
    .literal([
      "Sin especificar",
      "Masculino",
      "Femenino",
      "No binario",
      "Prefiero no decir",
    ])
    .optional(),
  defaultServings: z
    .number()
    .min(1, "La racion mimina es 1")
    .max(1000, "La racion maxima es 1000"),
  dietaryPreferences: z
    .array(
      z
        .string()
        .min(2, "Cada preferencia dietética debe tener al menos 2 caracteres")
        .max(
          50,
          "Cada preferencia dietética debe tener un máximo de 50 caracteres",
        )
        .toLowerCase(),
    )
    .max(25, "No puedes seleccionar más de 25 preferencias dietéticas")
    .optional(),
  allergenWarnings: z
    .array(
      z
        .string()
        .min(2, "Cada advertencia de alérgeno debe tener al menos 2 caracteres")
        .max(
          50,
          "Cada advertencia de alérgeno debe tener un máximo de 50 caracteres",
        )
        .toLowerCase(),
    )
    .max(25, "No puedes seleccionar más de 25 advertencias de alérgenos")
    .optional(),
});

// 2. Extraemos el tipo de TypeScript automáticamente basándonos en el esquema
export type ProfileFormData = z.infer<typeof profileSchema>;
