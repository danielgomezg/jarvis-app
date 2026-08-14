import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'juan@email.com' })
  @IsEmail({}, { message: 'Debe ser un formato de correo electrónico válido.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  email: string;

  @ApiProperty({ example: 'MiPassword123' })
  @IsString({ message: 'La contraseña debe ser un texto.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password: string;
}
