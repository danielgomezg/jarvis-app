import {
  IsString,
  MaxLength,
  MinLength,
  IsInt,
  IsPhoneNumber,
  Min,
  Max,
  IsDateString,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  ArrayUnique,
  IsIn,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

const trim = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeList = (value: unknown): unknown => {
  if (!Array.isArray(value)) return value;
  return (value as unknown[]).map((v) =>
    typeof v === 'string' ? v.trim().toLowerCase() : v,
  );
};

export class UpdateProfileDto {
  @IsString({ message: 'El nombre de usuario debe ser un texto.' })
  //@IsNotEmpty({ message: 'El nombre de usuario es obligatorio.' })
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @MinLength(3, {
    message: 'El nombre de usuario debe tener al menos 3 caracteres.',
  })
  @MaxLength(30, {
    message: 'El nombre de usuario no puede superar los 30 caracteres.',
  })
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message:
      'El nombre de usuario solo admite letras sin acentos, números, punto, guion y guion bajo.',
  })
  @ApiProperty({ example: 'juanperez' })
  userName: string; // Para la tabla user, se puede generar automáticamente a partir del email o nombre y es único para cada usuario

  @IsString({ message: 'El nombre debe ser un texto.' })
  @Transform(({ value }) => trim(value))
  @MinLength(1, { message: 'El nombre debe tener al menos 1 caracteres.' })
  @MaxLength(50, { message: 'El nombre no puede superar los 50 caracteres.' })
  @IsOptional()
  @ApiProperty({ example: 'Juan' })
  firstName?: string | null;

  @IsString({ message: 'El apellido debe ser un texto.' })
  @Transform(({ value }) => trim(value))
  @MinLength(1, { message: 'El apellido debe tener al menos 1 caracteres.' })
  @MaxLength(50, {
    message: 'El apellido no puede superar los 50 caracteres.',
  })
  @IsOptional()
  @ApiProperty({ example: 'Pérez' })
  lastName?: string | null;

  @IsString({ message: 'El teléfono debe ser un texto.' })
  @Transform(({ value }) => trim(value))
  @IsPhoneNumber(undefined, {
    message: 'El teléfono debe ser un número de teléfono válido.',
  })
  @IsOptional()
  @ApiProperty({ example: '+1234567890' })
  phone?: string | null;

  @IsString({ message: 'El género debe ser un texto.' })
  @Transform(({ value }) => trim(value))
  @MinLength(2, { message: 'El género debe tener al menos 2 caracteres.' })
  @MaxLength(20, { message: 'El género no puede superar los 20 caracteres.' })
  @IsOptional()
  @IsIn(
    [
      'Sin especificar',
      'Masculino',
      'Femenino',
      'No binario',
      'Prefiero no decir',
    ],
    {
      message: 'El género debe ser uno de los valores permitidos.',
    },
  )
  @ApiProperty({ example: 'Masculino' })
  gender?: string | null;

  @ApiProperty({ example: '1990-01-01' })
  @IsOptional()
  @IsDateString(
    {},
    {
      message: 'La fecha de nacimiento debe ser una fecha válida.',
    },
  )
  birthDate?: string | null;

  @IsInt({ message: 'Las porciones por defecto debe ser un número entero.' })
  @ApiProperty({ example: 2 })
  @IsOptional()
  @Min(1, { message: 'Las porciones por defecto debe ser al menos 1.' })
  @Max(100, { message: 'La racion maxima es 100' })
  defaultServings?: number;

  @Transform(({ value }) => normalizeList(value))
  @MinLength(2, {
    each: true,
    message: 'Cada preferencia dietética debe tener al menos 2 caracteres.',
  })
  @MaxLength(50, {
    each: true,
    message: 'Cada preferencia dietética no puede superar los 50 caracteres.',
  })
  @IsString({
    each: true,
    message: 'Cada preferencia dietética debe ser un texto.',
  })
  @IsOptional()
  @IsArray({ message: 'Las preferencias dietéticas deben ser un arreglo.' })
  @ArrayMaxSize(25, {
    message: 'No se pueden tener más de 25 preferencias dietéticas.',
  })
  @ArrayUnique({
    message: 'Las preferencias dietéticas deben ser únicas.',
  })
  @ApiProperty({ example: ['Vegetariano', 'Sin gluten'] })
  dietaryPreferences?: string[];

  @Transform(({ value }) => normalizeList(value))
  @MinLength(2, {
    each: true,
    message: 'Cada advertencia de alergia debe tener al menos 2 caracteres.',
  })
  @MaxLength(50, {
    each: true,
    message: 'Cada advertencia de alergia no puede superar los 50 caracteres.',
  })
  @IsString({
    each: true,
    message: 'Cada advertencia de alergia debe ser un texto.',
  })
  @IsOptional()
  @IsArray({ message: 'Las advertencias de alergia deben ser un arreglo.' })
  @ArrayMaxSize(25, {
    message: 'No se pueden tener más de 25 advertencias de alergia.',
  })
  @ArrayUnique({
    message: 'Las advertencias de alergia deben ser únicas.',
  })
  @ApiProperty({ example: ['Nueces', 'Lactosa'] })
  allergenWarnings?: string[];
}
