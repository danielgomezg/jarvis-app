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
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 10, // 10 requests por minuto globalmente
      },
      {
        name: 'short',
        ttl: 60000, // 1 minuto
        limit: 3,
      },
      {
        name: 'long',
        ttl: 3600000, // 1 hora
        limit: 5,
      },
    ]),
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
