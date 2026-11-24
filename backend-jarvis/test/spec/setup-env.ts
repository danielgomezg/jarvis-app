/*
 * Variables de entorno falsas para los tests de aceptación.
 *
 * La suite levanta la app completa (AppModule) y varios servicios validan
 * sus credenciales en el constructor:
 *   - GoogleStrategy / GithubStrategy → passport exige clientID
 *   - MailService                     → exige SENDGRID_API_KEY
 *   - PrismaService                   → exige DATABASE_URL (acá se mockea)
 *
 * Localmente esto lo tapaba el `.env`; en CI no existe. Los valores son
 * falsos a propósito: los tests nunca hablan con Google, GitHub ni SendGrid.
 *
 * Ojo: este archivo corre ANTES que ConfigModule (setupFiles), y
 * @nestjs/config no pisa claves que ya estén en process.env, así que estos
 * valores ganan sobre el `.env`. El `??` sirve para respetar variables
 * exportadas en el shell o inyectadas por CI.
 *
 * El `SG.` delante de la key falsa es para que el cliente de SendGrid no
 * emita el warning `API key does not start with "SG."`.
 */
const defaults: Record<string, string> = {
  JWT_SECRET: 'spec-test-jwt-secret',
  JWT_REFRESH_SECRET: 'spec-test-jwt-refresh-secret',
  DATABASE_URL: 'postgresql://spec:spec@localhost:5432/spec',
  FRONTEND_URL: 'http://localhost:5173',
  SENDGRID_API_KEY: 'SG.spec-test-key',
  SENDGRID_FROM_EMAIL: 'spec@jarvis.test',
  SENDGRID_FROM_NAME: 'Jarvis Spec',
  GOOGLE_CLIENT_ID: 'spec-google-client-id',
  GOOGLE_SECRET: 'spec-google-secret',
  GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/v1/auth/google/callback',
  GITHUB_CLIENT_ID: 'spec-github-client-id',
  GITHUB_CLIENT_SECRET: 'spec-github-client-secret',
  GITHUB_CALLBACK_URL: 'http://localhost:3000/api/v1/auth/github/callback',
};

for (const [key, value] of Object.entries(defaults)) {
  process.env[key] = process.env[key] ?? value;
}
