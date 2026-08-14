import type { Profile } from 'passport-github2';
import { GithubStrategy } from './github.strategy';
import { AuthService } from '../auth.service';

/**
 * Tests unitarios de GithubStrategy.
 *
 * Son iguales en concepto a los de GoogleStrategy (ver google.strategy.spec.ts).
 * La única diferencia: GitHub devuelve el nombre de usuario (`username`) y el
 * nombre completo en un solo campo `displayName` (ej: "Juan Perez"), mientras
 * que Google los trae separados.
 *
 * Recordá la idea central de los tests unitarios: aislar una pieza de código
 * y "fingir" (mock) todo lo demás. Acá lo único REAL es la strategy; el
 * authService, el profile y done son falsos.
 */

describe('GithubStrategy', () => {
  // Mock del AuthService: método falso que registra cómo fue llamado.
  const authService = {
    validateOAuthUser: jest.fn(),
  };

  // Config falsa de la app de GitHub (necesaria para construir la strategy).
  const config = {
    clientID: 'github-client-id',
    clientSecret: 'github-client-secret',
    callbackURL: 'http://localhost:3001/api/v1/auth/github/callback',
  } as any;

  // Profile FALSO: como si GitHub devolviera los datos de Juan Perez.
  const mockProfile = {
    id: 'github-123', // id del usuario en GitHub
    emails: [{ value: 'juan@mail.com' }],
    displayName: 'Juan Perez', // GitHub trae el nombre completo junto
    username: 'juanperez', // nombre de usuario de GitHub
    photos: [{ value: 'https://avatar.com/juan.jpg' }],
  } as unknown as Profile;

  let strategy: GithubStrategy;

  // Se ejecuta antes de cada test: limpia mocks y crea la strategy nueva.
  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new GithubStrategy(
      config,
      authService as unknown as AuthService,
    );
  });

  // TEST 1: la strategy pasa el profile de GitHub a validateOAuthUser
  // formateado (email, proveedor GITHUB, id de GitHub, etc).
  it('debe llamar validateOAuthUser con los datos del perfil de GitHub', async () => {
    // Arrange: el mock "encuentra" al usuario en la DB.
    authService.validateOAuthUser.mockResolvedValue({
      id: 'user-1',
      userName: 'juanperez',
      profile: { firstName: 'Juan', lastName: 'Perez' },
    });
    const done = jest.fn();

    // Act: simulamos el login de GitHub.
    await strategy.validate('access', 'refresh', mockProfile, done);

    // Assert: la llamada a authService llevaba estos campos.
    expect(authService.validateOAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'juan@mail.com',
        provider: 'GITHUB',
        provider_account_id: 'github-123',
        avatar: 'https://avatar.com/juan.jpg',
      }),
    );
  });

  // TEST 2: tras validar, la strategy responde con el usuario enriquecido
  // con los datos de la DB (id real, userName de la DB).
  it('debe llamar done con el usuario enriquecido con los datos de DB', async () => {
    // Arrange: la DB devuelve un usuario con datos propios.
    authService.validateOAuthUser.mockResolvedValue({
      id: 'user-1',
      userName: 'db-username',
      profile: { firstName: 'Juan DB', lastName: 'Perez DB' },
    });
    const done = jest.fn();

    // Act.
    await strategy.validate('access', 'refresh', mockProfile, done);

    // Assert: done(null, usuario) con los datos de la DB.
    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        userName: 'db-username',
        userId: 'user-1',
        firstName: 'Juan DB',
        lastName: 'Perez DB',
        email: 'juan@mail.com',
        provider: 'GITHUB',
      }),
    );
  });

  // TEST 3: si la DB devuelve el usuario pero sin profile, el login sigue
  // funcionando igual (done se llama sin error).
  it('debe llamar done con el usuario aunque el profile de DB sea null', async () => {
    // Arrange: profile = null.
    authService.validateOAuthUser.mockResolvedValue({
      id: 'user-1',
      userName: 'juanperez',
      profile: null,
    });
    const done = jest.fn();

    // Act.
    await strategy.validate('access', 'refresh', mockProfile, done);

    // Assert: el login NO se rechaza, done se llama con el usuario.
    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        email: 'juan@mail.com',
        provider: 'GITHUB',
        userName: 'juanperez',
        userId: 'user-1',
      }),
    );
  });

  // TEST 4: si GitHub no devuelve email, no se puede crear/buscar usuario:
  // la strategy rechaza el login y ni siquiera consulta a authService.
  it('debe rechazar con error si GitHub no devuelve email', async () => {
    // Arrange: profile sin emails.
    const done = jest.fn();
    const profileWithoutEmail = {
      ...mockProfile,
      emails: undefined,
    } as unknown as Profile;

    // Act.
    await strategy.validate('access', 'refresh', profileWithoutEmail, done);

    // Assert: error "No email returned by GitHub" y authService no fue llamado.
    expect(done).toHaveBeenCalledWith(
      new Error('No email returned by GitHub'),
      false,
    );
    expect(authService.validateOAuthUser).not.toHaveBeenCalled();
  });

  // TEST 5: si authService devuelve null (no encontró ni creó el usuario),
  // la strategy rechaza el login con un error genérico.
  it('debe rechazar con error si validateOAuthUser no devuelve usuario', async () => {
    // Arrange: el mock devuelve null.
    authService.validateOAuthUser.mockResolvedValue(null);
    const done = jest.fn();

    // Act.
    await strategy.validate('access', 'refresh', mockProfile, done);

    // Assert: login rechazado.
    expect(done).toHaveBeenCalledWith(new Error('Ha ocurrido un error'), false);
  });
});
