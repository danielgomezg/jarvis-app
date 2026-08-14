import { z } from "zod";

export const registerSchema = z
  .object({
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
    email: z.string().email("Introduce un correo electrónico válido"),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// 2. Extraemos el tipo de TypeScript automáticamente basándonos en el esquema
export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Introduce un correo electrónico válido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const resendVerificationSchema = z.object({
  email: z.string().email("Introduce un correo electrónico válido"),
});

export type ResendVerificationFormData = z.infer<
  typeof resendVerificationSchema
>;
