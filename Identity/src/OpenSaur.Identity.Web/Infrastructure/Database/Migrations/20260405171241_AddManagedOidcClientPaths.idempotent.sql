START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260405171241_AddManagedOidcClientPaths') THEN
    ALTER TABLE "OidcClients" ADD "CallbackPath" character varying(200) NOT NULL DEFAULT '/auth/callback';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260405171241_AddManagedOidcClientPaths') THEN
    ALTER TABLE "OidcClients" ADD "PostLogoutPath" character varying(200) NOT NULL DEFAULT '/login';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260405171241_AddManagedOidcClientPaths') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260405171241_AddManagedOidcClientPaths', '10.0.3');
    END IF;
END $EF$;
COMMIT;

