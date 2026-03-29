START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329043521_AddWorkspaceRoleAvailability') THEN
    CREATE TABLE "WorkspaceRoles" (
        "Id" uuid NOT NULL,
        "WorkspaceId" uuid NOT NULL,
        "RoleId" uuid NOT NULL,
        "Description" character varying(255) NOT NULL,
        "IsActive" boolean NOT NULL,
        "CreatedBy" uuid NOT NULL,
        "CreatedOn" timestamp with time zone NOT NULL,
        "UpdatedBy" uuid,
        "UpdatedOn" timestamp with time zone,
        CONSTRAINT "PK_WorkspaceRoles" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_WorkspaceRoles_Roles_RoleId" FOREIGN KEY ("RoleId") REFERENCES "Roles" ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_WorkspaceRoles_Workspaces_WorkspaceId" FOREIGN KEY ("WorkspaceId") REFERENCES "Workspaces" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329043521_AddWorkspaceRoleAvailability') THEN
    UPDATE "Roles" SET "Name" = 'Super Administrator', "NormalizedName" = 'SUPER ADMINISTRATOR'
    WHERE "Id" = '38e983f9-e09f-4c6f-b5c9-2f8949b8c5fc';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329043521_AddWorkspaceRoleAvailability') THEN
    INSERT INTO "WorkspaceRoles" ("Id", "CreatedBy", "CreatedOn", "Description", "IsActive", "RoleId", "UpdatedBy", "UpdatedOn", "WorkspaceId")
    VALUES ('4dba0a76-675d-487d-9d0c-7e4bdbb98b7e', '67be05c0-1f88-4a2c-86f4-d97ad4589135', TIMESTAMPTZ '2026-03-22T00:00:00Z', 'Default personal-workspace user role availability.', TRUE, '1cf3d7a5-b4b3-4b08-b3a8-b5c62f5266b4', NULL, NULL, 'e3a2d95a-9d31-4232-b617-1ea4cdc65f88');
    INSERT INTO "WorkspaceRoles" ("Id", "CreatedBy", "CreatedOn", "Description", "IsActive", "RoleId", "UpdatedBy", "UpdatedOn", "WorkspaceId")
    VALUES ('81a4f14f-27f9-4b8a-a360-b26e71877648', '67be05c0-1f88-4a2c-86f4-d97ad4589135', TIMESTAMPTZ '2026-03-22T00:00:00Z', 'Default personal-workspace administrator role availability.', TRUE, 'ebc29128-4abe-4456-9c09-f9348ddfe91c', NULL, NULL, 'e3a2d95a-9d31-4232-b617-1ea4cdc65f88');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329043521_AddWorkspaceRoleAvailability') THEN
    CREATE UNIQUE INDEX "IX_WorkspaceRoles_Id" ON "WorkspaceRoles" ("Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329043521_AddWorkspaceRoleAvailability') THEN
    CREATE INDEX "IX_WorkspaceRoles_RoleId" ON "WorkspaceRoles" ("RoleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329043521_AddWorkspaceRoleAvailability') THEN
    CREATE UNIQUE INDEX "IX_WorkspaceRoles_WorkspaceId_RoleId" ON "WorkspaceRoles" ("WorkspaceId", "RoleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329043521_AddWorkspaceRoleAvailability') THEN
    INSERT INTO "WorkspaceRoles" ("Id", "WorkspaceId", "RoleId", "Description", "IsActive", "CreatedBy", "CreatedOn", "UpdatedBy", "UpdatedOn")
    SELECT
        (
            SUBSTRING(md5(workspaces."Id"::text || roles."Id"::text || 'workspace-role-backfill') FROM 1 FOR 8) || '-' ||
            SUBSTRING(md5(workspaces."Id"::text || roles."Id"::text || 'workspace-role-backfill') FROM 9 FOR 4) || '-' ||
            SUBSTRING(md5(workspaces."Id"::text || roles."Id"::text || 'workspace-role-backfill') FROM 13 FOR 4) || '-' ||
            SUBSTRING(md5(workspaces."Id"::text || roles."Id"::text || 'workspace-role-backfill') FROM 17 FOR 4) || '-' ||
            SUBSTRING(md5(workspaces."Id"::text || roles."Id"::text || 'workspace-role-backfill') FROM 21 FOR 12)
        )::uuid,
        workspaces."Id",
        roles."Id",
        'Backfilled workspace role availability.',
        TRUE,
        workspaces."CreatedBy",
        NOW(),
        NULL,
        NULL
    FROM "Workspaces" AS workspaces
    CROSS JOIN "Roles" AS roles
    WHERE roles."IsActive" = TRUE
      AND REPLACE(COALESCE(roles."NormalizedName", ''), ' ', '') <> 'SUPERADMINISTRATOR'
      AND NOT EXISTS (
          SELECT 1
          FROM "WorkspaceRoles" AS workspaceRoles
          WHERE workspaceRoles."WorkspaceId" = workspaces."Id"
            AND workspaceRoles."RoleId" = roles."Id");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329043521_AddWorkspaceRoleAvailability') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260329043521_AddWorkspaceRoleAvailability', '10.0.3');
    END IF;
END $EF$;
COMMIT;

