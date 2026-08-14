import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Detectar el entorno actual
  const isProd = process.env.NODE_ENV === 'production';

  // 2. Configuración dinámica de CORS
  app.enableCors({
    origin: isProd ? process.env.FRONTEND_URL : 'http://localhost:3000', // URL de tu frontend según el entorno
    credentials: true, // Permite el intercambio seguro de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Métodos HTTP permitidos
    allowedHeaders: ['Content-Type', 'Authorization'], // Encabezados permitidos
  });

  //PARA LEER COOKIES
  app.use(cookieParser());

  const GLOBAL_PREFIX = 'api/v1';
  app.setGlobalPrefix(GLOBAL_PREFIX);

  // 1. Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Jarvis API')
    .setDescription('API para el proyecto Jarvis')
    .setVersion('1.0')
    .addTag('auth', 'Endpoints de autenticación y registro') // Etiqueta para agrupar endpoints de autenticación
    .addBearerAuth() // Habilita la autenticación Bearer (JWT) en Swagger
    .setBasePath(GLOBAL_PREFIX)
    .build();

  // 2. Generación del documento Swagger a partir de los controladores y DTOs
  const document = SwaggerModule.createDocument(app, config);

  // 3. Configuración del endpoint para la UI de Swagger
  SwaggerModule.setup('docs', app, document);

  // Render cambia HTTPS a HTTP internamente; esto obliga a NestJS a confiar en Render para no bloquear las cookies seguras.
  // ¡IMPORTANTE! Para que esto funcione en producción, el servidor final DEBE tener configurado obligatoriamente un certificado HTTPS (SSL).
  if (isProd) {
    // Moldeamos el resultado a un objeto de Express nativo para eliminar el 'any'
    //const server = app.getHttpServer()
    const server = app.getHttpServer() as {
      set?: (key: string, value: number) => void;
    };
    if (server && typeof server.set === 'function') {
      server.set('trust proxy', 1); // Confía en el balanceador de carga de la plataforma [https://expressjs.com]
    }
  }
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
