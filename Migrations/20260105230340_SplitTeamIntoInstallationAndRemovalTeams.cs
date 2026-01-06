using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class SplitTeamIntoInstallationAndRemovalTeams : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SecurityZones_Teams_TeamId",
                table: "SecurityZones");

            migrationBuilder.RenameColumn(
                name: "TeamId",
                table: "SecurityZones",
                newName: "RemovalTeamId");

            migrationBuilder.RenameIndex(
                name: "IX_SecurityZones_TeamId",
                table: "SecurityZones",
                newName: "IX_SecurityZones_RemovalTeamId");

            migrationBuilder.AddColumn<Guid>(
                name: "InstallationTeamId",
                table: "SecurityZones",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SecurityZones_InstallationTeamId",
                table: "SecurityZones",
                column: "InstallationTeamId");

            migrationBuilder.AddForeignKey(
                name: "FK_SecurityZones_Teams_InstallationTeamId",
                table: "SecurityZones",
                column: "InstallationTeamId",
                principalTable: "Teams",
                principalColumn: "UUID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_SecurityZones_Teams_RemovalTeamId",
                table: "SecurityZones",
                column: "RemovalTeamId",
                principalTable: "Teams",
                principalColumn: "UUID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SecurityZones_Teams_InstallationTeamId",
                table: "SecurityZones");

            migrationBuilder.DropForeignKey(
                name: "FK_SecurityZones_Teams_RemovalTeamId",
                table: "SecurityZones");

            migrationBuilder.DropIndex(
                name: "IX_SecurityZones_InstallationTeamId",
                table: "SecurityZones");

            migrationBuilder.DropColumn(
                name: "InstallationTeamId",
                table: "SecurityZones");

            migrationBuilder.RenameColumn(
                name: "RemovalTeamId",
                table: "SecurityZones",
                newName: "TeamId");

            migrationBuilder.RenameIndex(
                name: "IX_SecurityZones_RemovalTeamId",
                table: "SecurityZones",
                newName: "IX_SecurityZones_TeamId");

            migrationBuilder.AddForeignKey(
                name: "FK_SecurityZones_Teams_TeamId",
                table: "SecurityZones",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "UUID",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
