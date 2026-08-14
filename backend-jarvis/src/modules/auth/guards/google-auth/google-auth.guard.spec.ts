import { AuthGuard } from '@nestjs/passport';
import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  it('should be defined', () => {
    expect(new GoogleAuthGuard()).toBeDefined();
  });

  it('debe ser un AuthGuard de Passport para la estrategia google', () => {
    const guard = new GoogleAuthGuard();
    expect(guard).toBeInstanceOf(AuthGuard('google'));
  });

  it('debe exponer canActivate para la cadena de guards de NestJS', () => {
    const guard = new GoogleAuthGuard();
    expect(typeof guard.canActivate).toBe('function');
  });
});
