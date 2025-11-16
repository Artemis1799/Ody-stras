using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoEquipmentAndImagePoint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Points_Evenements_Event_ID",
                table: "Points");

            migrationBuilder.RenameColumn(
                name: "Image_ID",
                table: "Points",
                newName: "ImageId");

            migrationBuilder.RenameColumn(
                name: "Event_ID",
                table: "Points",
                newName: "EventId");

            migrationBuilder.RenameIndex(
                name: "IX_Points_Event_ID",
                table: "Points",
                newName: "IX_Points_EventId");

            migrationBuilder.AddColumn<Guid>(
                name: "EquipmentId",
                table: "Points",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<int>(
                name: "EquipmentQuantity",
                table: "Points",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Equipments",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Unite = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Stock_total = table.Column<float>(type: "REAL", nullable: true),
                    Stock_restant = table.Column<float>(type: "REAL", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipments", x => x.UUID);
                });

            migrationBuilder.CreateTable(
                name: "Photos",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Picture = table.Column<byte[]>(type: "BLOB", nullable: false),
                    Picture_name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Photos", x => x.UUID);
                });

            migrationBuilder.CreateTable(
                name: "ImagePoints",
                columns: table => new
                {
                    ImageId = table.Column<Guid>(type: "TEXT", nullable: false),
                    PointId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImagePoints", x => new { x.ImageId, x.PointId });
                    table.ForeignKey(
                        name: "FK_ImagePoints_Photos_ImageId",
                        column: x => x.ImageId,
                        principalTable: "Photos",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ImagePoints_Points_PointId",
                        column: x => x.PointId,
                        principalTable: "Points",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Points_EquipmentId",
                table: "Points",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_ImagePoints_PointId",
                table: "ImagePoints",
                column: "PointId");

            migrationBuilder.AddForeignKey(
                name: "FK_Points_Equipments_EquipmentId",
                table: "Points",
                column: "EquipmentId",
                principalTable: "Equipments",
                principalColumn: "UUID",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Points_Evenements_EventId",
                table: "Points",
                column: "EventId",
                principalTable: "Evenements",
                principalColumn: "UUID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Points_Equipments_EquipmentId",
                table: "Points");

            migrationBuilder.DropForeignKey(
                name: "FK_Points_Evenements_EventId",
                table: "Points");

            migrationBuilder.DropTable(
                name: "Equipments");

            migrationBuilder.DropTable(
                name: "ImagePoints");

            migrationBuilder.DropTable(
                name: "Photos");

            migrationBuilder.DropIndex(
                name: "IX_Points_EquipmentId",
                table: "Points");

            migrationBuilder.DropColumn(
                name: "EquipmentId",
                table: "Points");

            migrationBuilder.DropColumn(
                name: "EquipmentQuantity",
                table: "Points");

            migrationBuilder.RenameColumn(
                name: "ImageId",
                table: "Points",
                newName: "Image_ID");

            migrationBuilder.RenameColumn(
                name: "EventId",
                table: "Points",
                newName: "Event_ID");

            migrationBuilder.RenameIndex(
                name: "IX_Points_EventId",
                table: "Points",
                newName: "IX_Points_Event_ID");

            migrationBuilder.AddForeignKey(
                name: "FK_Points_Evenements_Event_ID",
                table: "Points",
                column: "Event_ID",
                principalTable: "Evenements",
                principalColumn: "UUID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
