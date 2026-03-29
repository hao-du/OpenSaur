START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329121421_AddUserFirstAndLastName') THEN
    ALTER TABLE "Users" ADD "FirstName" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329121421_AddUserFirstAndLastName') THEN
    ALTER TABLE "Users" ADD "LastName" text NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329121421_AddUserFirstAndLastName') THEN
    UPDATE "Users" SET "FirstName" = 'System', "LastName" = 'Administrator'
    WHERE "Id" = 'd2deace4-2350-42cd-bba6-c7b18cf54d39';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260329121421_AddUserFirstAndLastName') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260329121421_AddUserFirstAndLastName', '10.0.3');
    END IF;
END $EF$;
COMMIT;

