using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace OpenSaur.Identity.Web.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceRoleAvailability : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkspaceRoles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkspaceRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkspaceRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkspaceRoles_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("38e983f9-e09f-4c6f-b5c9-2f8949b8c5fc"),
                columns: new[] { "Name", "NormalizedName" },
                values: new object[] { "Super Administrator", "SUPER ADMINISTRATOR" });

            migrationBuilder.InsertData(
                table: "WorkspaceRoles",
                columns: new[] { "Id", "CreatedBy", "CreatedOn", "Description", "IsActive", "RoleId", "UpdatedBy", "UpdatedOn", "WorkspaceId" },
                values: new object[,]
                {
                    { new Guid("4dba0a76-675d-487d-9d0c-7e4bdbb98b7e"), new Guid("67be05c0-1f88-4a2c-86f4-d97ad4589135"), new DateTime(2026, 3, 22, 0, 0, 0, 0, DateTimeKind.Utc), "Default personal-workspace user role availability.", true, new Guid("1cf3d7a5-b4b3-4b08-b3a8-b5c62f5266b4"), null, null, new Guid("e3a2d95a-9d31-4232-b617-1ea4cdc65f88") },
                    { new Guid("81a4f14f-27f9-4b8a-a360-b26e71877648"), new Guid("67be05c0-1f88-4a2c-86f4-d97ad4589135"), new DateTime(2026, 3, 22, 0, 0, 0, 0, DateTimeKind.Utc), "Default personal-workspace administrator role availability.", true, new Guid("ebc29128-4abe-4456-9c09-f9348ddfe91c"), null, null, new Guid("e3a2d95a-9d31-4232-b617-1ea4cdc65f88") }
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceRoles_Id",
                table: "WorkspaceRoles",
                column: "Id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceRoles_RoleId",
                table: "WorkspaceRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceRoles_WorkspaceId_RoleId",
                table: "WorkspaceRoles",
                columns: new[] { "WorkspaceId", "RoleId" },
                unique: true);

            migrationBuilder.Sql(
                """
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
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkspaceRoles");

            migrationBuilder.UpdateData(
                table: "Roles",
                keyColumn: "Id",
                keyValue: new Guid("38e983f9-e09f-4c6f-b5c9-2f8949b8c5fc"),
                columns: new[] { "Name", "NormalizedName" },
                values: new object[] { "SuperAdministrator", "SUPERADMINISTRATOR" });
        }
    }
}
