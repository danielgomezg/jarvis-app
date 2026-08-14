import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';

// 1. Interfaz del Payload JWT (lo que se guarda dentro del token)
interface JwtPayload {
  sub: string; // ID del usuario (Auth ID)
  email: string; // Email del usuario
}

// 2. Estrategia JWT personalizada para Passport
//Recordar que 'jwt' es el nombre que le dimos a esta estrategia en el super() y se usará en @UseGuards(AuthGuard('jwt')), si no se especifica, el guard buscará una estrategia por defecto llamada 'jwt'.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  // Inyección de ConfigService (para el secreto) y PrismaService (para buscar el usuario)
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // ASIGNACIÓN ESTRICTA: Le decimos a TS que el valor NO será undefined.
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      // Manejo de error en tiempo de ejecución: Si el .env está mal configurado
      throw new InternalServerErrorException(
        'JWT_SECRET no está configurado en el entorno.',
      );
    }
    // 1. Configuración de la estrategia JWT:
    // - Cómo se extrae el token del request
    // - Clave secreta para verificar la firma
    // - Opciones adicionales (ej: expiración)
    super({
      // 2. Cómo se extrae el JWT del request (del header 'Authorization: Bearer <token>')
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // 3. Clave secreta para verificar la firma del token (Debe coincidir con la de login)
      secretOrKey: secret,
      // 4. No ignora la expiración (si el token expira, Passport lo rechaza automáticamente)
      ignoreExpiration: false,
    });
  }

  // 5. Método de Validación: Se ejecuta si la firma es válida.
  // El 'payload' es el objeto que pusiste en el token durante el login ({sub, email}).
  async validate(payload: JwtPayload) {
    try {
      // Opcional: Busca el registro de usuario para asegurar que el ID aún exista en la DB
      const auth = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true }, // Si quieres adjuntar más info al req.user, selecciónala aquí
        //select: { id: true, email: true, profile: { select: { id: true } } },
      });

      if (!auth) {
        // Si el ID del token ya no existe en la DB, es inválido
        throw new UnauthorizedException();
      }

      // Retorna el objeto que quieres adjuntar al request (req.user)
      return {
        authId: auth.id,
        email: auth.email,
        //profileId: auth.profile?.id,
      };
    } catch (error) {
      //SIEMPRE registrar errores de DB/Red.
      console.error(
        'Error de base de datos durante la verificación JWT:',
        error,
      );
      // error 401
      throw new UnauthorizedException('Fallo la autenticación del token.');
    }
  }
}
