START TRANSACTION;
ALTER TABLE "OidcClients" ADD "CallbackPath" character varying(200) NOT NULL DEFAULT '/auth/callback';

ALTER TABLE "OidcClients" ADD "PostLogoutPath" character varying(200) NOT NULL DEFAULT '/login';

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260405171241_AddManagedOidcClientPaths', '10.0.3');

COMMIT;

