import { SetMetadata } from '@nestjs/common';

// Esta clave la usará el Guard para identificar qué rutas ignorar
export const IS_PUBLIC_KEY = 'isPublic';

// Este es el decorador que usarás en tu login, registro y cualquier ruta que quieras que sea pública (sin JWT)
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
