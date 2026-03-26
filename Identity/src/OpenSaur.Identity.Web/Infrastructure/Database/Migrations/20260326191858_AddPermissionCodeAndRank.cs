using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenSaur.Identity.Web.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddPermissionCodeAndRank : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "Permissions",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Rank",
                table: "Permissions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("52b23446-4b62-497f-b8ef-b254be4a7570"),
                columns: new[] { "Code", "Rank" },
                values: new object[] { "Administrator.CanManage", 2 });

            migrationBuilder.UpdateData(
                table: "Permissions",
                keyColumn: "Id",
                keyValue: new Guid("dd49a1d9-a22f-4906-9788-cd4e9f74af95"),
                columns: new[] { "Code", "Rank" },
                values: new object[] { "Administrator.CanView", 1 });

            migrationBuilder.CreateIndex(
                name: "IX_Permissions_Code",
                table: "Permissions",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Permissions_Code",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "Permissions");

            migrationBuilder.DropColumn(
                name: "Rank",
                table: "Permissions");
        }
    }
}
