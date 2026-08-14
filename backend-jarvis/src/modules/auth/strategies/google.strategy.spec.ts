import type { Profile } from 'passport-google-oauth20';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from '../auth.service';

/**
 * Tests unitarios de GoogleStrategy.
 *
 * QUE ES UNA STRATEGY EN PASSPORT:
 * Passport es el encargado de manejar el login. Una "strategy" (estrategia)
 * es el código que se encarga de UNA forma de autenticarse (Google, GitHub,
 * JWT, email+password, etc).
 *
 * QUE HACE GoogleStrategy:
 * Cuando el usuario se loguea con Google, Google redirige al navegador de
 * vuelta a nuestra app con los datos del usuario. Passport llama entonces al
 * método `validate()` de la strategy con el "profile" (los datos que devolvió
 * Google). La strategy:
 *   1. Extrae lo que nos interesa del profile (email, nombre, foto).
 *   2. Lo pasa a `authService.validateOAuthUser()` para que el servicio busque
 *      al usuario en la DB o lo cree si no existe.
 *   3. Llama a `done(err, user)` para decirle a Passport cómo terminó.
 *
 * QUE ES UN "MOCK" (imitar/fingir):
 * Un test unitario aísla UNA sola pieza de código. Para eso, todo lo demás se
 * "mockea": se reemplaza por una copia falsa que NO toca la DB ni hace
 * llamadas reales. Acá:
 *   - `authService` es un mock (falso) con un solo método: `validateOAuthUser`.
 *   - `config` son las credenciales de la app de Google (valores falsos).
 *   - `mockProfile` es un profile FALSO, como si Google hubiera devuelto los
 *     datos de un usuario llamado Juan Perez.
 *
 * ESTRUCTURA DE CADA TEST (patrón AAA):
 *   Arrange  -> preparamos el escenario (qué devuelve el mock, qué inputs).
 *   Act      -> ejecutamos el código real que queremos probar (`validate()`).
 *   Assert   -> verificamos que se comportó como esperábamos (`expect`).
 */

describe('GoogleStrategy', () => {
  // Mock de AuthService: su único método será un jest.fn() (función falsa
  // que registra cómo fue llamada). En cada test le diremos qué devolver.
  const authService = {
    validateOAuthUser: jest.fn(),
  };

  // Config falsa de la app de Google (no se usa en los tests, pero es
  // necesaria para construir la strategy sin errores).
  const config = {
    clientID: 'google-client-id',
    clientSecret: 'google-client-secret',
    callbackURL: 'http://localhost:3001/api/v1/auth/google/callback',
  } as any;

  // Profile FALSO: esto es lo que Google devolvería en la vida real para un
  // usuario con email juan@mail.com.
  const mockProfile = {
    id: 'google-123', // id del usuario en Google
    emails: [{ value: 'juan@mail.com' }], // emails (Google puede traer varios)
    name: { givenName: 'Juan', familyName: 'Perez' }, // nombre y apellido
    photos: [{ value: 'https://avatar.com/juan.jpg' }], // foto de perfil
    displayName: 'Juan Perez',
    username: 'juanperez',
  } as unknown as Profile;

  let strategy: GoogleStrategy;

  // Se ejecuta ANTES de cada test: limpia las llamadas registradas de los
  // mocks y crea una strategy nueva (así cada test arranca de cero).
  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new GoogleStrategy(
      config,
      authService as unknown as AuthService,
    );
  });

  // TEST 1: verificamos que la strategy pasa los datos del profile a
  // authService.validateOAuthUser() bien formateados (email, proveedor, etc).
  // Para eso le decimos al mock que "devuelva un usuario de la DB" y luego
  // comprobamos con qué argumentos fue llamada la función falsa.
  it('debe llamar validateOAuthUser con los datos del perfil de Google', async () => {
    // Arrange: el mock devuelve el usuario que "encontró" en la DB.
    authService.validateOAuthUser.mockResolvedValue({
      id: 'user-1',
      userName: 'juanperez',
      profile: { firstName: 'Juan', lastName: 'Perez' },
    });
    // done es la función que Passport usa como respuesta. También es un mock
    // (falso): en lugar de terminar el login, solo registra cómo fue llamada.
    const done = jest.fn();

    // Act: ejecutamos validate() como lo haría Passport en el login real.
    await strategy.validate('access', 'refresh', mockProfile, done);

    // Assert: confirmamos que validateOAuthUser fue llamada, y que el objeto
    // que le pasamos contenía al menos (objectContaining) estos campos.
    // objectContaining = "contiene estos campos, pero puede tener otros más".
    expect(authService.validateOAuthUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'juan@mail.com',
        provider: 'GOOGLE',
        provider_account_id: 'google-123',
        avatar: 'https://avatar.com/juan.jpg',
      }),
    );
  });

  // TEST 2: verificamos que, tras validar con la DB, la strategy llama a
  // done(null, usuario) con los datos de la DB (ej: el id real de la DB).
  // done(null, ...) con error null significa "login exitoso".
  it('debe llamar done con el usuario enriquecido con los datos de DB', async () => {
    // Arrange: la DB "devuelve" un usuario con id user-1 y nombre de usuario
    // db-username (distinto al de Google, para ver que se usa el de la DB).
    authService.validateOAuthUser.mockResolvedValue({
      id: 'user-1',
      userName: 'db-username',
      profile: { firstName: 'Juan DB', lastName: 'Perez DB' },
    });
    const done = jest.fn();

    // Act: simulamos el login de Google.
    await strategy.validate('access', 'refresh', mockProfile, done);

    // Assert: done debe haber sido llamada con (error=null, usuario) y ese
    // usuario debe traer el userName y el id de la DB (no los de Google).
    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        userName: 'db-username',
        userId: 'user-1',
        firstName: 'Juan DB',
        lastName: 'Perez DB',
        email: 'juan@mail.com',
        provider: 'GOOGLE',
      }),
    );
  });

  // TEST 3: caso donde la DB devuelve el usuario pero sin datos de "profile"
  // (ej: el usuario aún no completó su perfil). La strategy debe seguir
  // logueando al usuario igual, sin explotar.
  it('debe usar firstName/lastName de Google si el profile de DB no los tiene', async () => {
    // Arrange: validateOAuthUser devuelve el usuario pero profile = null.
    authService.validateOAuthUser.mockResolvedValue({
      id: 'user-1',
      userName: 'juanperez',
      profile: null,
    });
    const done = jest.fn();

    // Act: simulamos el login.
    await strategy.validate('access', 'refresh', mockProfile, done);

    // Assert: done se llamó sin error y con los datos de Google como fallback.
    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        firstName: 'Juan',
        lastName: 'Perez',
      }),
    );
  });

  // TEST 4: caso de error de Google. Si Google no devuelve email (algo puede
  // salir mal en el flujo de Google), NO se puede crear/buscar un usuario, así
  // que la strategy debe rechazar el login con un error.
  it('debe rechazar con error si Google no devuelve email', async () => {
    // Arrange: profile sin emails.
    const done = jest.fn();
    const profileWithoutEmail = {
      ...mockProfile,
      emails: undefined,
    } as unknown as Profile;

    // Act.
    await strategy.validate('access', 'refresh', profileWithoutEmail, done);

    // Assert: done llamada con el error "No email returned by Google" y
    // usuario = false (login rechazado). Además, como no hay email, la
    // strategy NO debería haber consultado a authService.
    expect(done).toHaveBeenCalledWith(
      new Error('No email returned by Google'),
      false,
    );
    expect(authService.validateOAuthUser).not.toHaveBeenCalled();
  });

  // TEST 5: caso de error del servidor. Si validateOAuthUser devuelve null
  // (no encontró ni creó el usuario), la strategy rechaza el login con un
  // error genérico "Ha ocurrido un error".
  it('debe rechazar con error si validateOAuthUser no devuelve usuario', async () => {
    // Arrange: el mock "no encuentra nada" → devuelve null.
    authService.validateOAuthUser.mockResolvedValue(null);
    const done = jest.fn();

    // Act.
    await strategy.validate('access', 'refresh', mockProfile, done);

    // Assert: login rechazado con el error genérico.
    expect(done).toHaveBeenCalledWith(new Error('Ha ocurrido un error'), false);
  });
});
