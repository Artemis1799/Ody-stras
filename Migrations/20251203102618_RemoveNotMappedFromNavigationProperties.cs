using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class RemoveNotMappedFromNavigationProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "EventUUID",
                table: "Points",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Points_EventUUID",
                table: "Points",
                column: "EventUUID");

            migrationBuilder.AddForeignKey(
                name: "FK_Points_Events_EventUUID",
                table: "Points",
                column: "EventUUID",
                principalTable: "Events",
                principalColumn: "UUID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Points_Events_EventUUID",
                table: "Points");

            migrationBuilder.DropIndex(
                name: "IX_Points_EventUUID",
                table: "Points");

            migrationBuilder.DropColumn(
                name: "EventUUID",
                table: "Points");
        }
    }
}
