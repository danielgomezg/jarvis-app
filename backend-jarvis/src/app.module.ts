import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { ProfileModule } from './modules/profile/profile.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    AuthModule,
    ProfileModule,
    PrismaModule,
    //rate limiting, para limitar las peticiones
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 60, // 60 requests por minuto globalmente
        },
        {
          name: 'short',
          ttl: 1000, // 1 segundo
          limit: 5,
        },
        {
          name: 'long',
          ttl: 3600000, // 1 hora
          limit: 1000,
        },
      ],
      // En desarrollo no limitamos para evitar 429 mientras se prueba la UI.
      skipIf: () => process.env.NODE_ENV !== 'production',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      // APP_GUARD le indica a NestJS que este proveedor es un Guard que envuelve a TODA la app
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
