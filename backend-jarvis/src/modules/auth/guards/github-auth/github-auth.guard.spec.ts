import { AuthGuard } from '@nestjs/passport';
import { GithubAuthGuard } from './github-auth.guard';

describe('GithubAuthGuard', () => {
  it('should be defined', () => {
    expect(new GithubAuthGuard()).toBeDefined();
  });

  it('debe ser un AuthGuard de Passport para la estrategia github', () => {
    const guard = new GithubAuthGuard();
    expect(guard).toBeInstanceOf(AuthGuard('github'));
  });

  it('debe exponer canActivate para la cadena de guards de NestJS', () => {
    const guard = new GithubAuthGuard();
    expect(typeof guard.canActivate).toBe('function');
  });
});
