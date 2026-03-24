using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenSaur.Identity.Web.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSystemAdministratorSeedPassword : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("d2deace4-2350-42cd-bba6-c7b18cf54d39"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAEOFFiUu7B4wSzY7A4i1/VLOUnRjvSDE14MryEaaq4/og63kvvhceW3RF1F+hb+ETlg==");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: new Guid("d2deace4-2350-42cd-bba6-c7b18cf54d39"),
                column: "PasswordHash",
                value: "AQAAAAIAAYagAAAAENLoUJMaZDYSIyqN+9f2mIif4gyyOql7xr05t+ucKjmRTuoTQWtNva/D0b80LGlKRA==");
        }
    }
}
