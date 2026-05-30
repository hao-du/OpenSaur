using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddCounterpartyDefaultFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDefault",
                table: "Counterparties",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDefault",
                table: "Counterparties");
        }
    }
}
