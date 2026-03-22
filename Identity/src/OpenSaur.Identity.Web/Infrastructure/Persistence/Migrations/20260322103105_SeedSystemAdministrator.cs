using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenSaur.Identity.Web.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeedSystemAdministrator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AccessFailedCount", "ConcurrencyStamp", "CreatedBy", "CreatedOn", "Description", "Email", "EmailConfirmed", "IsActive", "LockoutEnabled", "LockoutEnd", "NormalizedEmail", "NormalizedUserName", "PasswordHash", "PhoneNumber", "PhoneNumberConfirmed", "SecurityStamp", "TwoFactorEnabled", "UpdatedBy", "UpdatedOn", "UserName", "UserSettings", "WorkspaceId" },
                values: new object[] { new Guid("d2deace4-2350-42cd-bba6-c7b18cf54d39"), 0, "d2deace4-2350-42cd-bba6-c7b18cf54d39", new Guid("67be05c0-1f88-4a2c-86f4-d97ad4589135"), new DateTime(2026, 3, 22, 0, 0, 0, 0, DateTimeKind.Utc), "Default system administrator account.", "SystemAdministrator@opensaur.local", true, true, false, null, "SYSTEMADMINISTRATOR@OPENSAUR.LOCAL", "SYSTEMADMINISTRATOR", "AQAAAAIAAYagAAAAENLoUJMaZDYSIyqN+9f2mIif4gyyOql7xr05t+ucKjmRTuoTQWtNva/D0b80LGlKRA==", null, false, "d2deace4235042cdbba6c7b18cf54d39", false, null, null, "SystemAdministrator", "{}", new Guid("e3a2d95a-9d31-4232-b617-1ea4cdc65f88") });

            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "RoleId", "UserId", "CreatedBy", "CreatedOn", "Description", "Id", "IsActive", "UpdatedBy", "UpdatedOn" },
                values: new object[] { new Guid("38e983f9-e09f-4c6f-b5c9-2f8949b8c5fc"), new Guid("d2deace4-2350-42cd-bba6-c7b18cf54d39"), new Guid("67be05c0-1f88-4a2c-86f4-d97ad4589135"), new DateTime(2026, 3, 22, 0, 0, 0, 0, DateTimeKind.Utc), "Default system administrator role assignment.", new Guid("dcbe2a91-7e7f-4f7a-a053-f9553fcc2aba"), true, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "UserRoles",
                keyColumns: new[] { "RoleId", "UserId" },
                keyValues: new object[] { new Guid("38e983f9-e09f-4c6f-b5c9-2f8949b8c5fc"), new Guid("d2deace4-2350-42cd-bba6-c7b18cf54d39") });

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("d2deace4-2350-42cd-bba6-c7b18cf54d39"));
        }
    }
}
