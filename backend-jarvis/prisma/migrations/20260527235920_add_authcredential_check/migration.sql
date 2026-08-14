-- AlterTable
ALTER TABLE "auth_credentials" ALTER COLUMN "provider_account_id" DROP NOT NULL;

ALTER TABLE "auth_credentials"
ADD CONSTRAINT check_local_auth_fields
CHECK (
  (provider = 'local' AND password_hash IS NOT NULL AND provider_account_id IS NULL)
  OR
  (provider <> 'local' AND password_hash IS NULL AND provider_account_id IS NOT NULL)
);
