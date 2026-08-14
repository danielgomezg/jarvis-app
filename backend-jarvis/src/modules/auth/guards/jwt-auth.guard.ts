import { Injectable, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // El Reflector nos permite leer la metadata (@Public) de los controladores/métodos
  constructor(private reflector: Reflector) {
    super();
  }

  // Este método se ejecuta en cada petición protegida por este guard, context es el objeto que contiene info de la petición, controlador, método, etc.
  canActivate(context: ExecutionContext) {
    // 1. Verifica si el endpoint específico o todo el controlador tienen el decorador @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(), // Método específico (ej: /auth/register)
      context.getClass(), // Controlador completo (ej: AuthController)
    ]);

    // 2. Si es público, saltamos la validación de Passport y dejamos pasar la petición
    if (isPublic) {
      return true;
    }

    // 3. Si NO es público, ejecuta la lógica heredada de Passport (valida el token)
    return super.canActivate(context);
  }
}
