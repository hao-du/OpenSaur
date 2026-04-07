using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenSaur.Identity.Web.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyPermissionCodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Permissions_CodeId",
                table: "Permissions");

            migrationBuilder.Sql(
                """
                DELETE FROM "RolePermissions"
                WHERE "PermissionId" = 'dd49a1d9-a22f-4906-9788-cd4e9f74af95';
                """);

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("dd49a1d9-a22f-4906-9788-cd4e9f74af95"));

            migrationBuilder.DropColumn(
                name: "CodeId",
                table: "Permissions");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("52b23446-4b62-497f-b8ef-b254be4a7570"),
                column: "Rank",
                value: 1);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CodeId",
                table: "Permissions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("52b23446-4b62-497f-b8ef-b254be4a7570"),
                columns: new[] { "CodeId", "Rank" },
                values: new object[] { 1, 1 });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Code", "CodeId", "CreatedBy", "CreatedOn", "Description", "IsActive", "Name", "PermissionScopeId", "Rank", "UpdatedBy", "UpdatedOn" },
                values: new object[] { new Guid("dd49a1d9-a22f-4906-9788-cd4e9f74af95"), "Administrator.CanView", 2, new Guid("67be05c0-1f88-4a2c-86f4-d97ad4589135"), new DateTime(2026, 3, 22, 0, 0, 0, 0, DateTimeKind.Utc), "Allows administrators to view identity configuration and records.", true, "Can View", new Guid("7284f832-b4f0-4508-9c96-98ce6f87db6d"), 1, null, null });

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_CodeId",
                table: "Permissions",
                column: "CodeId",
                unique: true);
        }
    }
}
