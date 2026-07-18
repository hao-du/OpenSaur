using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Migrations
{
    public partial class AddTagMarker : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Marker",
                table: "TagDefinitions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Marker",
                table: "TagDefinitions");
        }
    }
}