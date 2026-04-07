using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenSaur.Identity.Web.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddUmbracoPermissionScope : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "PermissionScopes",
                columns: new[] { "Id", "CreatedBy", "CreatedOn", "Description", "IsActive", "Name", "UpdatedBy", "UpdatedOn" },
                values: new object[] { new Guid("818c0a78-e5f3-4737-b9a1-920fb467ade8"), new Guid("67be05c0-1f88-4a2c-86f4-d97ad4589135"), new DateTime(2026, 3, 22, 0, 0, 0, 0, DateTimeKind.Utc), "Capabilities for managing Umbraco-integrated backoffice access.", true, "Umbraco", null, null });

            migrationBuilder.InsertData(
                table: "Permissions",
                columns: new[] { "Id", "Code", "CreatedBy", "CreatedOn", "Description", "IsActive", "Name", "PermissionScopeId", "Rank", "UpdatedBy", "UpdatedOn" },
                values: new object[] { new Guid("6a7b1568-8fed-42e5-b192-7e6f8401ae61"), "Umbraco.CanManage", new Guid("67be05c0-1f88-4a2c-86f4-d97ad4589135"), new DateTime(2026, 3, 22, 0, 0, 0, 0, DateTimeKind.Utc), "Allows users to manage Umbraco-integrated backoffice capabilities.", true, "Can Manage", new Guid("818c0a78-e5f3-4737-b9a1-920fb467ade8"), 1, null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("6a7b1568-8fed-42e5-b192-7e6f8401ae61"));

            migrationBuilder.DeleteData(
                table: "PermissionScopes",
                keyColumn: "Id",
                keyValue: new Guid("818c0a78-e5f3-4737-b9a1-920fb467ade8"));
        }
    }
}
