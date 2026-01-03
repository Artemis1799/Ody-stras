using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class AddCommentAndPicturesToSecurityZone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Comment",
                table: "SecurityZones",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "PointId",
                table: "Pictures",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "TEXT");

            migrationBuilder.AddColumn<Guid>(
                name: "SecurityZoneId",
                table: "Pictures",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Pictures_SecurityZoneId",
                table: "Pictures",
                column: "SecurityZoneId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pictures_SecurityZones_SecurityZoneId",
                table: "Pictures",
                column: "SecurityZoneId",
                principalTable: "SecurityZones",
                principalColumn: "UUID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pictures_SecurityZones_SecurityZoneId",
                table: "Pictures");

            migrationBuilder.DropIndex(
                name: "IX_Pictures_SecurityZoneId",
                table: "Pictures");

            migrationBuilder.DropColumn(
                name: "Comment",
                table: "SecurityZones");

            migrationBuilder.DropColumn(
                name: "SecurityZoneId",
                table: "Pictures");

            migrationBuilder.AlterColumn<Guid>(
                name: "PointId",
                table: "Pictures",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "TEXT",
                oldNullable: true);
        }
    }
}
