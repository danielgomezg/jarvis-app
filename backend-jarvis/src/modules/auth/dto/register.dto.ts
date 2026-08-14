import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

//DTO Para registrar un nuevo usuario, con validaciones y documentación Swagger cuando el provider sea local, ya que el provider de Google o otros, se realizara en el servicio de auth
export class RegisterDto {
  @IsString({ message: 'El nombre debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres.' })
  @ApiProperty({ example: 'Juan' })
  firstName: string; // Para la tabla Profile

  @IsString({ message: 'El apellido debe ser un texto.' })
  @IsNotEmpty({ message: 'El apellido es obligatorio.' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres.' })
  @MaxLength(100, {
    message: 'El apellido no puede superar los 100 caracteres.',
  })
  @ApiProperty({ example: 'Pérez' })
  lastName: string; // Para la tabla Profile

  @IsString({ message: 'El nombre de usuario debe ser un texto.' })
  @IsNotEmpty({ message: 'El nombre de usuario es obligatorio.' })
  @MinLength(2, {
    message: 'El nombre de usuario debe tener al menos 2 caracteres.',
  })
  @MaxLength(50, {
    message: 'El nombre de usuario no puede superar los 50 caracteres.',
  })
  @ApiProperty({ example: 'juanperez' })
  userName: string; // Para la tabla user, se puede generar automáticamente a partir del email o nombre y es único para cada usuario

  @IsEmail({}, { message: 'Debe ser un formato de correo electrónico válido.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  @ApiProperty({ example: 'juan@email.com' })
  email: string; // Para la tabla User

  @IsString({ message: 'La contraseña debe ser un texto.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @ApiProperty({ example: 'MiPassword123', minLength: 8 })
  password: string; // Para hashing en la tabla AuthCredential
}
