using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamToSecurityZone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TeamId",
                table: "SecurityZones",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SecurityZones_TeamId",
                table: "SecurityZones",
                column: "TeamId");

            migrationBuilder.AddForeignKey(
                name: "FK_SecurityZones_Teams_TeamId",
                table: "SecurityZones",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "UUID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SecurityZones_Teams_TeamId",
                table: "SecurityZones");

            migrationBuilder.DropIndex(
                name: "IX_SecurityZones_TeamId",
                table: "SecurityZones");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "SecurityZones");
        }
    }
}
