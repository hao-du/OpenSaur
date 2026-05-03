CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;
CREATE TABLE "Users" (
    "Id" uuid NOT NULL,
    "Email" character varying(256) NOT NULL,
    "UserName" character varying(256) NOT NULL,
    "FirstName" character varying(200) NOT NULL,
    "LastName" character varying(200) NOT NULL,
    "WorkspaceId" uuid NOT NULL,
    "WorkspaceName" character varying(200) NOT NULL,
    "UserSettings" jsonb NOT NULL,
    "Roles" jsonb NOT NULL,
    "Permissions" jsonb NOT NULL,
    "CreatedBy" uuid NOT NULL,
    "CreatedOn" timestamp with time zone NOT NULL,
    "UpdatedBy" uuid,
    "UpdatedOn" timestamp with time zone,
    "IsActive" boolean NOT NULL,
    CONSTRAINT "PK_Users" PRIMARY KEY ("Id")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260503100903_InitialCreate', '10.0.7');

COMMIT;

