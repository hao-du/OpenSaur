-- Migration: 20260615232117_AddPendingTransactionSubmissions
-- Database: PostgreSQL
-- Notes:
-- 1) Create pending transaction submissions table
-- 2) Add owner/local transaction uniqueness constraint
-- 3) Track migration in EF history

BEGIN;

CREATE TABLE IF NOT EXISTS "PendingTransactionSubmissions" (
    "Id" uuid NOT NULL,
    "OwnerId" uuid NOT NULL,
    "LocalTransactionId" character varying(64) NOT NULL,
    "PayloadJson" jsonb NOT NULL,
    "CreatedBy" uuid NOT NULL,
    "CreatedOn" timestamp with time zone NOT NULL,
    "UpdatedBy" uuid NULL,
    "UpdatedOn" timestamp with time zone NULL,
    CONSTRAINT "PK_PendingTransactionSubmissions" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_PendingTransactionSubmissions_Users_OwnerId"
        FOREIGN KEY ("OwnerId") REFERENCES "Users"("Id") ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS "IX_PendingTransactionSubmissions_OwnerId_LocalTransactionId"
    ON "PendingTransactionSubmissions" ("OwnerId", "LocalTransactionId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "__EFMigrationsHistory"
        WHERE "MigrationId" = '20260615232117_AddPendingTransactionSubmissions'
    ) THEN
        INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
        VALUES ('20260615232117_AddPendingTransactionSubmissions', '10.0.7');
    END IF;
END $$;

COMMIT;
