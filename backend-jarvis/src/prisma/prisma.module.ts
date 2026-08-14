import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Hace que el servicio esté disponible en toda la aplicación
@Module({
  providers: [PrismaService], // Declara el servicio
  exports: [PrismaService], // Permite que otros módulos lo utilicen
})
export class PrismaModule {}
