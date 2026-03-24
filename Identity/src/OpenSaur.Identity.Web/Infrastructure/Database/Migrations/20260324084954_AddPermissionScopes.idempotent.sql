START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260324084954_AddPermissionScopes') THEN
    ALTER TABLE "Permissions" ADD "PermissionScopeId" uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260324084954_AddPermissionScopes') THEN
    CREATE TABLE "PermissionScopes" (
        "Id" uuid NOT NULL,
        "Name" character varying(200) NOT NULL,
        "Description" character varying(255) NOT NULL,
        "IsActive" boolean NOT NULL,
        "CreatedBy" uuid NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedBy" uuid,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_PermissionScopes" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260324084954_AddPermissionScopes') THEN
    INSERT INTO "PermissionScopes" ("Id", "CreatedBy", "CreatedOn", "Description", "IsActive", "Name", "UpdatedBy", "UpdatedOn")
    VALUES ('7284f832-b4f0-4508-9c96-98ce6f87db6d', '67be05c0-1f88-4a2c-86f4-d97ad4589135', TIMESTAMPTZ '2026-03-22T00:00:00Z', 'Administrative capabilities for managing the identity service.', TRUE, 'Administrator', NULL, NULL);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260324084954_AddPermissionScopes') THEN
    UPDATE "Permissions" SET "Description" = 'Allows administrators to manage identity configuration and records.', "PermissionScopeId" = '7284f832-b4f0-4508-9c96-98ce6f87db6d'
    WHERE "Id" = '52b23446-4b62-497f-b8ef-b254be4a7570';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260324084954_AddPermissionScopes') THEN
    INSERT INTO "Permissions" ("Id", "CodeId", "CreatedBy", "CreatedOn", "Description", "IsActive", "Name", "PermissionScopeId", "UpdatedBy", "UpdatedOn")
    VALUES ('dd49a1d9-a22f-4906-9788-cd4e9f74af95', 2, '67be05c0-1f88-4a2c-86f4-d97ad4589135', TIMESTAMPTZ '2026-03-22T00:00:00Z', 'Allows administrators to view identity configuration and records.', TRUE, 'Can View', '7284f832-b4f0-4508-9c96-98ce6f87db6d', NULL, NULL);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260324084954_AddPermissionScopes') THEN
    CREATE INDEX "IX_Permissions_PermissionScopeId" ON "Permissions" ("PermissionScopeId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260324084954_AddPermissionScopes') THEN
    CREATE UNIQUE INDEX "IX_PermissionScopes_Name" ON "PermissionScopes" ("Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260324084954_AddPermissionScopes') THEN
    ALTER TABLE "Permissions" ADD CONSTRAINT "FK_Permissions_PermissionScopes_PermissionScopeId" FOREIGN KEY ("PermissionScopeId") REFERENCES "PermissionScopes" ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260324084954_AddPermissionScopes') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260324084954_AddPermissionScopes', '10.0.3');
    END IF;
END $EF$;
COMMIT;

