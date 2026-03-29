START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329105057_AddWorkspaceMaxActiveUsers') THEN
    ALTER TABLE "Workspaces" ADD "MaxActiveUsers" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329105057_AddWorkspaceMaxActiveUsers') THEN
    UPDATE "Workspaces" SET "MaxActiveUsers" = NULL
    WHERE "Id" = 'e3a2d95a-9d31-4232-b617-1ea4cdc65f88';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329105057_AddWorkspaceMaxActiveUsers') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260329105057_AddWorkspaceMaxActiveUsers', '10.0.3');
    END IF;
END $EF$;
COMMIT;

