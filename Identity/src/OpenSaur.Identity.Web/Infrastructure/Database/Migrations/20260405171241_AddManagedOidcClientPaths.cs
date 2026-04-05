using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenSaur.Identity.Web.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddManagedOidcClientPaths : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CallbackPath",
                table: "OidcClients",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "/auth/callback");

            migrationBuilder.AddColumn<string>(
                name: "PostLogoutPath",
                table: "OidcClients",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "/login");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CallbackPath",
                table: "OidcClients");

            migrationBuilder.DropColumn(
                name: "PostLogoutPath",
                table: "OidcClients");
        }
    }
}
