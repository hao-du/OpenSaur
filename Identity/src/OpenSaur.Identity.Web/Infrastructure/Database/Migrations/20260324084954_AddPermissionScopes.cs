using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenSaur.Identity.Web.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddPermissionScopes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PermissionScopeId",
                table: "Permissions",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateTable(
                name: "PermissionScopes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PermissionScopes", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PermissionScopes",
                columns: new[] { "Id", "CreatedBy", "CreatedOn", "Description", "IsActive", "Name", "UpdatedBy", "UpdatedOn" },
                values: new object[] { new Guid("7284f832-b4f0-4508-9c96-98ce6f87db6d"), new Guid("67be05c0-1f88-4a2c-86f4-d97ad4589135"), new DateTime(2026, 3, 22, 0, 0, 0, 0, DateTimeKind.Utc), "Administrative capabilities for managing the identity service.", true, "Administrator", null, null });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("52b23446-4b62-497f-b8ef-b254be4a7570"),
                columns: new[] { "Description", "PermissionScopeId" },
                values: new object[] { "Allows administrators to manage identity configuration and records.", new Guid("7284f832-b4f0-4508-9c96-98ce6f87db6d") });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "CodeId", "CreatedBy", "CreatedOn", "Description", "IsActive", "Name", "PermissionScopeId", "UpdatedBy", "UpdatedOn" },
                values: new object[] { new Guid("dd49a1d9-a22f-4906-9788-cd4e9f74af95"), 2, new Guid("67be05c0-1f88-4a2c-86f4-d97ad4589135"), new DateTime(2026, 3, 22, 0, 0, 0, 0, DateTimeKind.Utc), "Allows administrators to view identity configuration and records.", true, "Can View", new Guid("7284f832-b4f0-4508-9c96-98ce6f87db6d"), null, null });

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_PermissionScopeId",
                table: "Permissions",
                column: "PermissionScopeId");

            migrationBuilder.CreateIndex(
                name: "IX_PermissionScopes_Name",
                table: "PermissionScopes",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Permissions_PermissionScopes_PermissionScopeId",
                table: "Permissions",
                column: "PermissionScopeId",
                principalTable: "PermissionScopes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Permissions_PermissionScopes_PermissionScopeId",
                table: "Permissions");

            migrationBuilder.DropTable(
                name: "PermissionScopes");

            migrationBuilder.DropIndex(
                name: "IX_Permissions_PermissionScopeId",
                table: "Permissions");

            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("dd49a1d9-a22f-4906-9788-cd4e9f74af95"));

            migrationBuilder.DropColumn(
                name: "PermissionScopeId",
                table: "Permissions");

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("52b23446-4b62-497f-b8ef-b254be4a7570"),
                column: "Description",
                value: "Allows administrator management operations.");
        }
    }
}
