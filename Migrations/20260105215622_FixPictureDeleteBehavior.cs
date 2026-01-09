using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class FixPictureDeleteBehavior : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pictures_Points_PointId",
                table: "Pictures");

            migrationBuilder.DropForeignKey(
                name: "FK_Pictures_SecurityZones_SecurityZoneId",
                table: "Pictures");

            migrationBuilder.AddForeignKey(
                name: "FK_Pictures_Points_PointId",
                table: "Pictures",
                column: "PointId",
                principalTable: "Points",
                principalColumn: "UUID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Pictures_SecurityZones_SecurityZoneId",
                table: "Pictures",
                column: "SecurityZoneId",
                principalTable: "SecurityZones",
                principalColumn: "UUID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pictures_Points_PointId",
                table: "Pictures");

            migrationBuilder.DropForeignKey(
                name: "FK_Pictures_SecurityZones_SecurityZoneId",
                table: "Pictures");

            migrationBuilder.AddForeignKey(
                name: "FK_Pictures_Points_PointId",
                table: "Pictures",
                column: "PointId",
                principalTable: "Points",
                principalColumn: "UUID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Pictures_SecurityZones_SecurityZoneId",
                table: "Pictures",
                column: "SecurityZoneId",
                principalTable: "SecurityZones",
                principalColumn: "UUID");
        }
    }
}
