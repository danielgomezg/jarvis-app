import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailModule } from 'src/modules/mail/mail.module';
import { PassportModule } from '@nestjs/passport'; // 1. Importar Passport
import { JwtModule } from '@nestjs/jwt'; // 2. Importar el módulo JWT
import { JwtStrategy } from './strategies/jwt.strategy'; // 3. Importar tu estrategia
import { ConfigModule } from '@nestjs/config';
import googleOauthConfig from './config/google-oauth.config';
import { GoogleStrategy } from './strategies/google.strategy';
import githubOAuthConfig from './config/github-oauth.config';
import { GithubStrategy } from './strategies/github.strategy';

@Module({
  imports: [
    MailModule,
    // 4. Registramos Passport y le decimos que la estrategia por defecto será 'jwt'
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // 5. Registramos JwtModule para que NestJS pueda firmar y leer los tokens
    JwtModule.register({}),
    ConfigModule.forFeature(googleOauthConfig),
    ConfigModule.forFeature(githubOAuthConfig),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // 6. Obligatorio: Registrar tu estrategia como proveedor para que NestJS la ejecute
    GoogleStrategy,
    GithubStrategy,
  ],
  exports: [
    PassportModule,
    JwtStrategy, // 7. Recomendado: Exportarlos por si otros módulos necesitan validar tokens manualmente
    // AuthService, // 8. Exportar el servicio de autenticación para que otros módulos puedan usarlo (ej: ProfileModule)
  ],
})
export class AuthModule {}
