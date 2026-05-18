-- Migration: 20260518140306_AddOwnerScopeToMasterData
-- Database: PostgreSQL
-- Notes:
-- 1) Add OwnerId as nullable
-- 2) Backfill existing rows with fixed owner id
-- 3) Set NOT NULL
-- 4) Add foreign keys and indexes/constraints

BEGIN;

-- Banks ----------------------------------------------------------------------
ALTER TABLE "Banks"
    ADD COLUMN IF NOT EXISTS "OwnerId" uuid NULL;

UPDATE "Banks"
SET "OwnerId" = 'd2deace4-2350-42cd-bba6-c7b18cf54d39'
WHERE "OwnerId" IS NULL;

ALTER TABLE "Banks"
    ALTER COLUMN "OwnerId" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Banks_Users_OwnerId'
    ) THEN
        ALTER TABLE "Banks"
            ADD CONSTRAINT "FK_Banks_Users_OwnerId"
            FOREIGN KEY ("OwnerId") REFERENCES "Users"("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DROP INDEX IF EXISTS "IX_Banks_ShortName";
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Banks_OwnerId_ShortName"
    ON "Banks" ("OwnerId", "ShortName");

-- Counterparties -------------------------------------------------------------
ALTER TABLE "Counterparties"
    ADD COLUMN IF NOT EXISTS "OwnerId" uuid NULL;

UPDATE "Counterparties"
SET "OwnerId" = 'd2deace4-2350-42cd-bba6-c7b18cf54d39'
WHERE "OwnerId" IS NULL;

ALTER TABLE "Counterparties"
    ALTER COLUMN "OwnerId" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Counterparties_Users_OwnerId'
    ) THEN
        ALTER TABLE "Counterparties"
            ADD CONSTRAINT "FK_Counterparties_Users_OwnerId"
            FOREIGN KEY ("OwnerId") REFERENCES "Users"("Id") ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS "IX_Counterparties_OwnerId_FullName"
    ON "Counterparties" ("OwnerId", "FullName");

-- Currencies -----------------------------------------------------------------
ALTER TABLE "Currencies"
    ADD COLUMN IF NOT EXISTS "OwnerId" uuid NULL;

UPDATE "Currencies"
SET "OwnerId" = 'd2deace4-2350-42cd-bba6-c7b18cf54d39'
WHERE "OwnerId" IS NULL;

ALTER TABLE "Currencies"
    ALTER COLUMN "OwnerId" SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'FK_Currencies_Users_OwnerId'
    ) THEN
        ALTER TABLE "Currencies"
            ADD CONSTRAINT "FK_Currencies_Users_OwnerId"
            FOREIGN KEY ("OwnerId") REFERENCES "Users"("Id") ON DELETE RESTRICT;
    END IF;
END $$;

DROP INDEX IF EXISTS "IX_Currencies_ShortName";
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Currencies_OwnerId_ShortName"
    ON "Currencies" ("OwnerId", "ShortName");

-- EF Core migration history --------------------------------------------------
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "__EFMigrationsHistory"
        WHERE "MigrationId" = '20260518140306_AddOwnerScopeToMasterData'
    ) THEN
        INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
        VALUES ('20260518140306_AddOwnerScopeToMasterData', '10.0.7');
    END IF;
END $$;

COMMIT;
