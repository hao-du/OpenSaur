using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OpenSaur.CashPilot.Web.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddTransactionItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TransactionItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    CashFlowId = table.Column<Guid>(type: "uuid", nullable: true),
                    BankAccountId = table.Column<Guid>(type: "uuid", nullable: true),
                    TransferId = table.Column<Guid>(type: "uuid", nullable: true),
                    CurrencyExchangeId = table.Column<Guid>(type: "uuid", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "uuid", nullable: true),
                    UpdatedOn = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransactionItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TransactionItems_BankAccounts_BankAccountId",
                        column: x => x.BankAccountId,
                        principalTable: "BankAccounts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TransactionItems_CashFlows_CashFlowId",
                        column: x => x.CashFlowId,
                        principalTable: "CashFlows",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TransactionItems_CurrencyExchanges_CurrencyExchangeId",
                        column: x => x.CurrencyExchangeId,
                        principalTable: "CurrencyExchanges",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TransactionItems_Transfers_TransferId",
                        column: x => x.TransferId,
                        principalTable: "Transfers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TransactionItems_BankAccountId",
                table: "TransactionItems",
                column: "BankAccountId");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionItems_CashFlowId",
                table: "TransactionItems",
                column: "CashFlowId");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionItems_CurrencyExchangeId",
                table: "TransactionItems",
                column: "CurrencyExchangeId");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionItems_TransferId",
                table: "TransactionItems",
                column: "TransferId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TransactionItems");
        }
    }
}
