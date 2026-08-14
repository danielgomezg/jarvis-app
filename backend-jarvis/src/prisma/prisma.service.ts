import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL'); //process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }

    const adapter = new PrismaPg(new Pool({ connectionString }));
    super({ adapter });
  }

  // Se conecta a la DB cuando el módulo inicia
  async onModuleInit() {
    await this.$connect();
  }

  // Cierra la conexión cuando la app se apaga
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
