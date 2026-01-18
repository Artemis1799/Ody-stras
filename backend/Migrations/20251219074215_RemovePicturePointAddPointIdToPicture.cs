using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class RemovePicturePointAddPointIdToPicture : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PicturePoints");

            migrationBuilder.AddColumn<Guid>(
                name: "PointId",
                table: "Pictures",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "IX_Pictures_PointId",
                table: "Pictures",
                column: "PointId");

            migrationBuilder.AddForeignKey(
                name: "FK_Pictures_Points_PointId",
                table: "Pictures",
                column: "PointId",
                principalTable: "Points",
                principalColumn: "UUID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pictures_Points_PointId",
                table: "Pictures");

            migrationBuilder.DropIndex(
                name: "IX_Pictures_PointId",
                table: "Pictures");

            migrationBuilder.DropColumn(
                name: "PointId",
                table: "Pictures");

            migrationBuilder.CreateTable(
                name: "PicturePoints",
                columns: table => new
                {
                    PictureId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PointId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PicturePoints", x => new { x.PictureId, x.PointId });
                    table.ForeignKey(
                        name: "FK_PicturePoints_Pictures_PictureId",
                        column: x => x.PictureId,
                        principalTable: "Pictures",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PicturePoints_Points_PointId",
                        column: x => x.PointId,
                        principalTable: "Points",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PicturePoints_PointId",
                table: "PicturePoints",
                column: "PointId");
        }
    }
}
