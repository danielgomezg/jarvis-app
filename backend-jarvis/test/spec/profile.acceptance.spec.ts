/*
 * Tests de aceptación del perfil — escritos ÚNICAMENTE a partir de:
 *   docs/specs/stage-02-profile.md (aprobada 2026-11-16)
 *
 * El módulo ProfileModule NO fue leído (ni su implementación ni sus tests).
 * PrismaService se mockea con un almacenamiento en memoria controlado por
 * jest.fn(), para poder simular: perfil existente, inexistente, conflicto de
 * userName (409) y falla inesperada del almacenamiento (500).
 */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { Prisma } from '@prisma/client';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

// ---------------------------------------------------------------------------
// Errores de Prisma reales
// ---------------------------------------------------------------------------
// No alcanza con un `new Error()` con `code: 'P2002'`: el código de producción
// usa `instanceof Prisma.PrismaClientKnownRequestError`, así que el mock tiene
// que lanzar la MISMA clase que lanzaría Prisma. Si no, un fallo de conflicto
// se ve como un error genérico y el test reporta un bug que no existe.
const CLIENT_VERSION = '7.8.0';

const uniqueConstraintError = (field: string) =>
  new Prisma.PrismaClientKnownRequestError(
    `Unique constraint failed on the fields: (\`${field}\`)`,
    {
      code: 'P2002',
      clientVersion: CLIENT_VERSION,
      meta: { target: [field] },
    },
  );

const recordNotFoundError = () =>
  new Prisma.PrismaClientKnownRequestError(
    'An operation failed because it depends on one or more records that were required but not found.',
    { code: 'P2025', clientVersion: CLIENT_VERSION },
  );

// ---------------------------------------------------------------------------
// Entorno de prueba
// ---------------------------------------------------------------------------
// Las variables de entorno (JWT, OAuth, SendGrid, DATABASE_URL) las define
// `test/spec/setup-env.ts`, que Jest carga ANTES de importar este archivo.

const USER_A = { id: 'user-a-id', email: 'a@test.com', userName: 'usuario_a' };
const USER_B = { id: 'user-b-id', email: 'b@test.com', userName: 'usuario_b' };
const USER_C = { id: 'user-c-id', email: 'c@test.com', userName: 'usuario_c' };

type ProfileRow = Record<string, any>;

const baseProfileA = (): ProfileRow => ({
  id: 'profile-a-id',
  userId: USER_A.id,
  firstName: 'Ana',
  lastName: 'García',
  phone: '+54 11 5555-5555',
  gender: 'Femenino',
  birthDate: new Date('1990-05-10T00:00:00.000Z'),
  defaultServings: 2,
  dietaryPreferences: ['vegano'],
  allergenWarnings: ['mani'],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const baseProfileB = (): ProfileRow => ({
  id: 'profile-b-id',
  userId: USER_B.id,
  firstName: 'Bruno',
  lastName: 'Pérez',
  phone: '+54 221 4444-4444',
  gender: 'Masculino',
  birthDate: new Date('1985-01-20T00:00:00.000Z'),
  defaultServings: 4,
  dietaryPreferences: ['keto'],
  allergenWarnings: ['gluten'],
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

/**
 * Mock de PrismaService con un mini-almacenamiento en memoria:
 * - user.findUnique/findFirst resuelven por `id` o por `userName`.
 * - user.update aplica cambios y RECHAZA con un error P2002 si el userName
 *   ya lo tiene otro usuario (simula la restricción UNIQUE de la base).
 * - profile.findUnique/findFirst resuelven por `userId` o `id`.
 * - profile.update/create/upsert aplican los cambios sobre la memoria.
 */
function buildPrismaMock(seed: {
  users: Record<string, any>;
  profiles: Record<string, any>;
}) {
  const users = new Map(Object.entries(seed.users));
  const profiles = new Map(Object.entries(seed.profiles));

  const clone = <T>(v: T): T =>
    v == null ? (null as unknown as T) : (JSON.parse(JSON.stringify(v)) as T);

  const findUser = (where: any): any => {
    if (!where) return null;
    if (where.id !== undefined) return users.get(where.id) ?? null;
    if (where.userName !== undefined) {
      for (const u of users.values()) {
        if (u.userName === where.userName) return u;
      }
      return null;
    }
    return null;
  };

  const findProfile = (where: any): any => {
    if (!where) return null;
    if (where.userId !== undefined) return profiles.get(where.userId) ?? null;
    if (where.id !== undefined) {
      for (const p of profiles.values()) if (p.id === where.id) return p;
      return null;
    }
    return null;
  };

  // El mock respeta `select` / `include` lo suficiente para que la
  // implementación pueda devolver `userName` por relación (profile.user) o por
  // consulta del usuario (user.profile). Así el test no obliga a una forma
  // concreta de implementarlo.
  const profileResult = (profile: ProfileRow | null, args: any): any => {
    if (!profile) return null;
    const row = clone(profile);
    if (args?.include?.user ?? args?.select?.user) {
      row.user = clone(users.get(profile.userId) ?? null);
    }
    if (args?.select) {
      const picked: any = {};
      for (const key of Object.keys(args.select)) {
        picked[key] = key === 'user' ? row.user : row[key];
      }
      return picked;
    }
    return row;
  };

  const userResult = (user: any, args: any): any => {
    if (!user) return null;
    const row = clone(user);
    if (args?.include?.profile ?? args?.select?.profile) {
      row.profile = clone(findProfile({ userId: user.id }));
    }
    if (args?.select) {
      const picked: any = {};
      for (const key of Object.keys(args.select)) {
        picked[key] = key === 'profile' ? row.profile : row[key];
      }
      return picked;
    }
    return row;
  };

  const applyProfileData = (row: ProfileRow, data: any): void => {
    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue; // Prisma ignora campos undefined
      row[key] = value;
    }
  };

  const mock: any = {
    user: {
      findUnique: jest.fn((args: any) =>
        Promise.resolve(userResult(findUser(args?.where), args)),
      ),
      findFirst: jest.fn((args: any) =>
        Promise.resolve(userResult(findUser(args?.where), args)),
      ),
      update: jest.fn(({ where, data }: any) => {
        const u = findUser(where);
        if (!u) {
          return Promise.reject(recordNotFoundError());
        }
        if (data?.userName && data.userName !== u.userName) {
          for (const other of users.values()) {
            if (other.id !== u.id && other.userName === data.userName) {
              return Promise.reject(uniqueConstraintError('user_name'));
            }
          }
        }
        Object.assign(u, data);
        return Promise.resolve(clone(u));
      }),
    },
    profile: {
      findUnique: jest.fn((args: any) =>
        Promise.resolve(profileResult(findProfile(args?.where), args)),
      ),
      findFirst: jest.fn((args: any) =>
        Promise.resolve(profileResult(findProfile(args?.where), args)),
      ),
      create: jest.fn(({ data }: any) => {
        const row: ProfileRow = {
          id: 'profile-new-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        profiles.set(row.userId, row);
        return Promise.resolve(clone(row));
      }),
      update: jest.fn(({ where, data }: any) => {
        const p = findProfile(where);
        if (!p) {
          return Promise.reject(recordNotFoundError());
        }
        applyProfileData(p, data);
        return Promise.resolve(clone(p));
      }),
      upsert: jest.fn(({ where, update, create }: any) => {
        const p = findProfile(where);
        if (p) {
          applyProfileData(p, update);
          return Promise.resolve(clone(p));
        }
        const row: ProfileRow = {
          id: 'profile-new-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...create,
        };
        profiles.set(row.userId, row);
        return Promise.resolve(clone(row));
      }),
    },
    // Prisma 7 usa $transaction tanto con arrays de promesas como con
    // funciones interactivas; soportamos ambas formas de forma transparente.
    $transaction: jest.fn((arg: any) => {
      if (typeof arg === 'function') return Promise.resolve(arg(mock));
      return Promise.all(arg);
    }),
  };

  return {
    mock,
    users,
    profiles,
    snapshot: () =>
      JSON.stringify({
        users: Object.fromEntries(users),
        profiles: Object.fromEntries(profiles),
      }),
  };
}

type DbHandle = ReturnType<typeof buildPrismaMock>;

const validUserName = 'nuevo.nombre_ok';
const validBody = {
  firstName: 'Ana Editada',
  lastName: 'García López',
  phone: '+54 11 5555-0000',
  gender: 'No binario',
  birthDate: '1995-08-20',
  defaultServings: 3,
  dietaryPreferences: ['vegetariano', 'sin-tacc'],
  allergenWarnings: ['soja'],
};

// ---------------------------------------------------------------------------
// Montaje de la app (replica lo que hace main.ts)
// ---------------------------------------------------------------------------

describe('Spec — Perfil (stage-02)', () => {
  let app: INestApplication<App>;
  let db: DbHandle;
  let tokenA: string;
  let tokenC: string;

  const createApp = async (seed?: Parameters<typeof buildPrismaMock>[0]) => {
    db = buildPrismaMock(
      seed ?? {
        users: {
          [USER_A.id]: { ...USER_A },
          [USER_B.id]: { ...USER_B },
          [USER_C.id]: { ...USER_C },
        },
        profiles: { [USER_A.id]: baseProfileA(), [USER_B.id]: baseProfileB() },
      },
    );

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(db.mock)
      .compile();

    const a = moduleFixture.createNestApplication();
    // Replicando main.ts (no se ejecuta en los tests):
    a.setGlobalPrefix('api/v1');
    a.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await a.init();

    const jwt = a.get(JwtService);
    const sign = (userId: string, email: string, expOffset = 0) =>
      jwt.sign(
        expOffset < 0
          ? {
              sub: userId,
              email,
              exp: Math.floor(Date.now() / 1000) + expOffset,
            }
          : { sub: userId, email },
        { secret: process.env.JWT_SECRET },
      );

    tokenA = sign(USER_A.id, USER_A.email);
    tokenC = sign(USER_C.id, USER_C.email); // usuario sin perfil
    return a;
  };

  const GET = (t?: string) =>
    request(app.getHttpServer())
      .get('/api/v1/profile/me')
      .set('Authorization', t ? `Bearer ${t}` : '');

  const PATCH = (body: unknown, t?: string) =>
    request(app.getHttpServer())
      .patch('/api/v1/profile/me')
      .set('Content-Type', 'application/json')
      .set('Authorization', t ? `Bearer ${t}` : '')
      .send(body);

  // ------------------------- GET /api/v1/profile/me -------------------------

  describe('GET /api/v1/profile/me', () => {
    let snapshotBefore: string;

    beforeEach(async () => {
      app = await createApp();
      snapshotBefore = db.snapshot();
    });

    afterEach(async () => {
      await app.close();
    });

    it('T01: 200 con perfil existente y los campos de la spec', async () => {
      const res = await GET(tokenA).expect(200);
      const body = res.body;
      expect(body.userName).toBe(USER_A.userName);
      expect(body).toEqual(
        expect.objectContaining({
          firstName: 'Ana',
          lastName: 'García',
          phone: expect.any(String),
          gender: 'Femenino',
          defaultServings: 2,
          dietaryPreferences: ['vegano'],
          allergenWarnings: ['mani'],
        }),
      );
      expect(String(body.birthDate)).toContain('1990-05-10');
    });

    it('T02: 200 sin datos sensibles (password, tokens, hashes)', async () => {
      const res = await GET(tokenA).expect(200);
      const raw = JSON.stringify(res.body).toLowerCase();
      for (const forbidden of [
        'password',
        'passwordhash',
        'refreshtoken',
        'verificationtoken',
        'token',
      ]) {
        expect(raw).not.toContain(forbidden);
      }
    });

    it('T03: 401 sin token', async () => {
      await GET().expect(401);
    });

    it('T04: 401 con token inválido', async () => {
      await GET('token-invalido-no-firmado').expect(401);
    });

    it('T05: 401 con token expirado', async () => {
      const expired = app.get(JwtService).sign(
        {
          sub: USER_A.id,
          email: USER_A.email,
          exp: Math.floor(Date.now() / 1000) - 3600,
        },
        { secret: process.env.JWT_SECRET },
      );
      await GET(expired).expect(401);
    });

    it('T06: 404 si el usuario no tiene perfil', async () => {
      const res = await GET(tokenC).expect(404);
      expect(res.body).toMatchObject({});
    });

    it('T07: devuelve solo el perfil del usuario del token', async () => {
      const res = await GET(tokenA).expect(200);
      expect(res.body.userName).toBe(USER_A.userName);
      expect(res.body.userName).not.toBe(USER_B.userName);
      expect(JSON.stringify(res.body)).not.toContain(USER_B.id);
    });

    it('T08: GET no modifica el almacenamiento (solo lectura)', async () => {
      await GET(tokenA).expect(200);
      expect(db.snapshot()).toBe(snapshotBefore);
    });
  });

  // ------------------------ PATCH /api/v1/profile/me ------------------------

  describe('PATCH /api/v1/profile/me — casos generales', () => {
    beforeEach(async () => {
      app = await createApp();
    });

    afterEach(async () => {
      await app.close();
    });

    it('T09: 200 con actualización válida y el cuerpo trae el perfil actualizado', async () => {
      const res = await PATCH(validBody, tokenA).expect(200);
      const body = res.body;
      expect(body.userName).toBe(USER_A.userName);
      expect(body).toEqual(
        expect.objectContaining({
          firstName: 'Ana Editada',
          lastName: 'García López',
          defaultServings: 3,
          dietaryPreferences: ['vegetariano', 'sin-tacc'],
          allergenWarnings: ['soja'],
        }),
      );
      expect(String(body.birthDate)).toContain('1995-08-20');
    });

    it('T10: la actualización se persiste en el almacenamiento', async () => {
      await PATCH(validBody, tokenA).expect(200);
      const stored = db.profiles.get(USER_A.id);
      expect(stored.firstName).toBe('Ana Editada');
      expect(stored.defaultServings).toBe(3);
    });

    it('T11: 400 con cuerpo vacío {}', async () => {
      await PATCH({}, tokenA).expect(400);
    });

    it('T12: 401 sin token', async () => {
      await PATCH(validBody).expect(401);
    });

    it('T13: 401 con token inválido', async () => {
      await PATCH(validBody, 'token-invalido').expect(401);
    });

    it('T14: 404 si el usuario del token no tiene perfil', async () => {
      await PATCH(validBody, tokenC).expect(404);
      // nada se guardó
      expect(db.profiles.has(USER_C.id)).toBe(false);
    });

    it('T15: actualización parcial — un campo enviado no borra los demás', async () => {
      await PATCH({ firstName: 'Solo Nombre' }, tokenA).expect(200);
      const stored = db.profiles.get(USER_A.id);
      expect(stored.firstName).toBe('Solo Nombre');
      expect(stored.lastName).toBe('García');
      expect(stored.phone).toBe('+54 11 5555-5555');
      expect(stored.gender).toBe('Femenino');
      expect(stored.defaultServings).toBe(2);
      expect(stored.dietaryPreferences).toEqual(['vegano']);
      expect(stored.allergenWarnings).toEqual(['mani']);
      expect(stored.birthDate).toBeInstanceOf(Date);
    });

    it('T16: birthDate omitida se conserva (no se borra)', async () => {
      await PATCH({ defaultServings: 5 }, tokenA).expect(200);
      const stored = db.profiles.get(USER_A.id);
      expect(stored.birthDate).toBeInstanceOf(Date);
      expect(stored.birthDate.toISOString()).toContain('1990-05-10');
    });

    it('T17: null limpia phone, gender y birthDate', async () => {
      await PATCH(
        { phone: null, gender: null, birthDate: null },
        tokenA,
      ).expect(200);
      const stored = db.profiles.get(USER_A.id);
      expect(stored.phone).toBeNull();
      expect(stored.gender).toBeNull();
      expect(stored.birthDate).toBeNull();
    });

    it('T18: los arrays se reemplazan enteros, no se mezclan', async () => {
      await PATCH({ dietaryPreferences: ['keto'] }, tokenA).expect(200);
      const stored = db.profiles.get(USER_A.id);
      expect(stored.dietaryPreferences).toEqual(['keto']);
      expect(stored.dietaryPreferences).toHaveLength(1);
    });

    it('T19: normalización — recorta espacios al inicio y fin', async () => {
      await PATCH({ firstName: '  Ana  ' }, tokenA).expect(200);
      expect(db.profiles.get(USER_A.id).firstName).toBe('Ana');
    });

    it('T20: normalización — los arrays se guardan en minúsculas', async () => {
      await PATCH(
        { dietaryPreferences: ['VEGANO', 'Keto'], allergenWarnings: ['MANÍ'] },
        tokenA,
      ).expect(200);
      const stored = db.profiles.get(USER_A.id);
      expect(stored.dietaryPreferences).toEqual(['vegano', 'keto']);
      expect(stored.allergenWarnings).toEqual(['maní']);
    });

    it('T21: 409 si otro usuario ya usa el userName', async () => {
      const res = await PATCH({ userName: USER_B.userName }, tokenA).expect(
        409,
      );
      expect(res.body).toMatchObject({});
      // Nada se modificó
      expect(db.users.get(USER_A.id).userName).toBe(USER_A.userName);
    });

    it('T22: 409 es atómico — los demás campos enviados NO se guardan', async () => {
      const before = db.snapshot();
      await PATCH(
        { userName: USER_B.userName, firstName: 'Cambiado' },
        tokenA,
      ).expect(409);
      const after = db.profiles.get(USER_A.id);
      expect(after.firstName).toBe('Ana'); // no se guardó
      expect(db.users.get(USER_A.id).userName).toBe(USER_A.userName);
      expect(db.snapshot()).toBe(before);
    });

    it('T23: 500 en falla inesperada del almacenamiento, sin filtrar detalles internos', async () => {
      const boom = new Error(
        'PrismaClientKnownRequestError: Invalid `this.prisma.profile.update()` invocation... SQL: UPDATE "profiles" SET first_name = $1',
      );
      // Todas las escrituras fallan
      db.mock.profile.update.mockRejectedValue(boom);
      db.mock.profile.create.mockRejectedValue(boom);
      db.mock.profile.upsert.mockRejectedValue(boom);
      db.mock.user.update.mockRejectedValue(boom);

      const res = await PATCH({ firstName: 'Falla' }, tokenA);
      expect(res.status).toBe(500);
      const raw = JSON.stringify(res.body);
      for (const leaked of [
        'Prisma',
        'SQL',
        'prisma',
        'UPDATE',
        'stack',
        'invocation',
        'profiles',
      ]) {
        expect(raw).not.toContain(leaked);
      }
    });

    it('T24: un usuario no puede modificar el perfil de otro', async () => {
      const beforeB = JSON.stringify(db.profiles.get(USER_B.id));
      await PATCH({ firstName: 'Intento de suplantación' }, tokenA).expect(200);
      const afterB = db.profiles.get(USER_B.id);
      expect(JSON.stringify(afterB)).toBe(beforeB);
      expect(db.profiles.get(USER_A.id).firstName).toBe(
        'Intento de suplantación',
      );
    });

    it('T25: el userName solo cambia para el usuario del token', async () => {
      await PATCH({ userName: validUserName }, tokenA).expect(200);
      expect(db.users.get(USER_A.id).userName).toBe(validUserName);
      expect(db.users.get(USER_B.id).userName).toBe(USER_B.userName);
    });

    it('T26: límites válidos — defaultServings 1 y 100 aceptados', async () => {
      await PATCH({ defaultServings: 1 }, tokenA).expect(200);
      await PATCH({ defaultServings: 100 }, tokenA).expect(200);
      expect(db.profiles.get(USER_A.id).defaultServings).toBe(100);
    });

    it('T27: límites válidos — userName de 30 caracteres aceptado', async () => {
      await PATCH({ userName: 'a'.repeat(30) }, tokenA).expect(200);
      expect(db.users.get(USER_A.id).userName).toBe('a'.repeat(30));
    });

    it('T27b: límites válidos — userName de 3 caracteres aceptado', async () => {
      await PATCH({ userName: 'abc' }, tokenA).expect(200);
      expect(db.users.get(USER_A.id).userName).toBe('abc');
    });
  });

  // ------------------ PATCH: validación de campos (400) ---------------------

  describe('PATCH /api/v1/profile/me — validación (400)', () => {
    beforeEach(async () => {
      app = await createApp();
    });

    afterEach(async () => {
      await app.close();
    });

    // Todos los casos mandan un userName válido como contexto, salvo los que
    // prueban justamente el userName. Sin ese contexto, el 400 podía venir de
    // "falta userName" y el test pasaba SIN probar la regla que decía probar.
    const invalidCases: Array<[string, unknown, RegExp]> = [
      ['userName corto (2)', { userName: 'ab' }, /nombre de usuario/],
      [
        'userName largo (31)',
        { userName: 'a'.repeat(31) },
        /nombre de usuario/,
      ],
      [
        'userName con espacios',
        { userName: 'tiene espacio' },
        /nombre de usuario/,
      ],
      [
        'userName con caracteres no permitidos',
        { userName: 'con@arroba' },
        /nombre de usuario/,
      ],
      ['userName con acentos', { userName: 'josé' }, /nombre de usuario/],
      ['firstName vacío', { firstName: '' }, /El nombre(?! de usuario)/],
      [
        'firstName largo (51)',
        { firstName: 'x'.repeat(51) },
        /El nombre(?! de usuario)/,
      ],
      ['lastName vacío', { lastName: '' }, /apellido/],
      ['lastName largo (51)', { lastName: 'x'.repeat(51) }, /apellido/],
      ['phone con caracteres no permitidos', { phone: 'abc@def' }, /teléfono/],
      ['phone corto (6)', { phone: '123456' }, /teléfono/],
      ['phone largo (21)', { phone: '1'.repeat(21) }, /teléfono/],
      ['gender fuera de la lista', { gender: 'Otro' }, /género/],
      ['birthDate futura', { birthDate: '2999-01-01' }, /fecha de nacimiento/],
      [
        'birthDate formato inválido',
        { birthDate: '10-05-1990' },
        /fecha de nacimiento/,
      ],
      ['defaultServings 0', { defaultServings: 0 }, /porciones|racion/i],
      ['defaultServings 101', { defaultServings: 101 }, /porciones|racion/i],
      [
        'defaultServings no entero',
        { defaultServings: 2.5 },
        /porciones|racion/i,
      ],
      [
        'dietaryPreferences con 26 elementos',
        {
          dietaryPreferences: Array.from({ length: 26 }, (_, i) => `pref-${i}`),
        },
        /preferencia/i,
      ],
      [
        'dietaryPreferences con elemento vacío',
        { dietaryPreferences: [''] },
        /preferencia/i,
      ],
      [
        'dietaryPreferences con duplicados',
        { dietaryPreferences: ['vegano', 'vegano'] },
        /preferencia/i,
      ],
      [
        'dietaryPreferences con duplicados por mayúsculas',
        { dietaryPreferences: ['Vegano', 'vegano'] },
        /preferencia/i,
      ],
      [
        'allergenWarnings con 26 elementos',
        { allergenWarnings: Array.from({ length: 26 }, (_, i) => `alrg-${i}`) },
        /alergia/,
      ],
      [
        'allergenWarnings con elemento vacío',
        { allergenWarnings: [''] },
        /alergia/,
      ],
      [
        'allergenWarnings con duplicados',
        { allergenWarnings: ['mani', 'mani'] },
        /alergia/,
      ],
      ['campo desconocido: role', { role: 'admin' }, /role/],
      ['campo desconocido: email', { email: 'x@y.com' }, /email/],
      ['campo desconocido: plan', { plan: 'premium' }, /plan/],
    ];

    invalidCases.forEach(([name, body, expectedMessage], i) => {
      it(`T28-${String(i + 1).padStart(2, '0')}: 400 — ${name}`, async () => {
        const before = db.snapshot();
        const payload =
          typeof body === 'object' && body !== null && 'userName' in body
            ? body
            : { userName: USER_A.userName, ...(body as object) };
        const res = await PATCH(payload, tokenA).expect(400);
        // El error tiene que ser POR ESE CAMPO, no por cualquier otro.
        const messages = ([] as string[]).concat(
          (res.body as { message?: string | string[] }).message ?? '',
        );
        expect(messages.join(' | ')).toMatch(expectedMessage);
        // Un 400 no debe haber modificado el almacenamiento
        expect(db.snapshot()).toBe(before);
      });
    });

    it('T28-29: 200 — userName con espacios en los bordes se recorta y se guarda sin espacios', async () => {
      // Regla de normalización: primero se recortan los bordes, después se
      // valida el resultado (sin espacios internos, charset permitido).
      await PATCH({ userName: '  nuevo_nombre  ' }, tokenA).expect(200);
      expect(db.users.get(USER_A.id).userName).toBe('nuevo_nombre');
    });
  });

  // ------------------------- Límite de peticiones (429) ----------------------
  // Fuera del alcance del piloto: el rate limiting solo se activa en
  // producción y el GET tiene un límite de 10.000 peticiones por minuto, así
  // que un 429 no es un comportamiento esperado de la API en este contexto.
  // Ver "Decisiones aprobadas" en la spec.
});
