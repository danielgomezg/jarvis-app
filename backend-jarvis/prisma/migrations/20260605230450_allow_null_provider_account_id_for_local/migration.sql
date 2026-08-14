-- This is an empty migration.
-- 1. Eliminamos los CHECKs conflictivos
ALTER TABLE "auth_credentials" DROP CONSTRAINT IF EXISTS check_pass_required_only_for_local;
ALTER TABLE "auth_credentials" DROP CONSTRAINT IF EXISTS check_local_auth_fields;

-- 2. Hacemos que la columna SÍ pueda ser nula para que no te obligue a mandar datos
ALTER TABLE "auth_credentials" ALTER COLUMN "provider_account_id" DROP NOT NULL;

-- 3. Creamos una regla limpia: si es LOCAL exige contraseña y permite cuenta nula. Si no es LOCAL, al revés.
ALTER TABLE "auth_credentials" ADD CONSTRAINT check_auth_logic CHECK (
  (UPPER(provider) = 'LOCAL' AND password_hash IS NOT NULL AND provider_account_id IS NULL)
  OR
  (UPPER(provider) <> 'LOCAL' AND password_hash IS NULL AND provider_account_id IS NOT NULL)
);
