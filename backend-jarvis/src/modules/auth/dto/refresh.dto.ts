import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshRequestDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.REFRESH-TOKEN-ANTIGUO',
  })
  refreshToken: string;
}
