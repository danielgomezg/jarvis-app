import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({ example: 'juan@email.com' })
  @IsEmail({}, { message: 'Debe ser un formato de correo electrónico válido.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  email: string;
}
