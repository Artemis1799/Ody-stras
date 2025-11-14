using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Equipements",
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
                    table.PrimaryKey("PK_Equipements", x => x.UUID);
                });

            migrationBuilder.CreateTable(
                name: "Evenements",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Nom = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "TEXT", nullable: false),
                    Date_debut = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Responsable = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Evenements", x => x.UUID);
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
                name: "Points",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Event_ID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Latitude = table.Column<float>(type: "REAL", nullable: true),
                    Longitude = table.Column<float>(type: "REAL", nullable: true),
                    Commentaire = table.Column<string>(type: "TEXT", nullable: false),
                    Image_ID = table.Column<Guid>(type: "TEXT", nullable: true),
                    Ordre = table.Column<int>(type: "INTEGER", nullable: true),
                    Valide = table.Column<bool>(type: "INTEGER", nullable: false),
                    Created = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Modified = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Points", x => x.UUID);
                    table.ForeignKey(
                        name: "FK_Points_Evenements_Event_ID",
                        column: x => x.Event_ID,
                        principalTable: "Evenements",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ImagePoints",
                columns: table => new
                {
                    Image_ID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Point_ID = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ImagePoints", x => new { x.Image_ID, x.Point_ID });
                    table.ForeignKey(
                        name: "FK_ImagePoints_Photos_Image_ID",
                        column: x => x.Image_ID,
                        principalTable: "Photos",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ImagePoints_Points_Point_ID",
                        column: x => x.Point_ID,
                        principalTable: "Points",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PointEquipements",
                columns: table => new
                {
                    Point_ID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Equipement_ID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Quantite = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedBy = table.Column<Guid>(type: "TEXT", nullable: true),
                    Created = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PointEquipements", x => new { x.Point_ID, x.Equipement_ID });
                    table.ForeignKey(
                        name: "FK_PointEquipements_Equipements_Equipement_ID",
                        column: x => x.Equipement_ID,
                        principalTable: "Equipements",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PointEquipements_Points_Point_ID",
                        column: x => x.Point_ID,
                        principalTable: "Points",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ImagePoints_Point_ID",
                table: "ImagePoints",
                column: "Point_ID");

            migrationBuilder.CreateIndex(
                name: "IX_PointEquipements_Equipement_ID",
                table: "PointEquipements",
                column: "Equipement_ID");

            migrationBuilder.CreateIndex(
                name: "IX_Points_Event_ID",
                table: "Points",
                column: "Event_ID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ImagePoints");

            migrationBuilder.DropTable(
                name: "PointEquipements");

            migrationBuilder.DropTable(
                name: "Photos");

            migrationBuilder.DropTable(
                name: "Equipements");

            migrationBuilder.DropTable(
                name: "Points");

            migrationBuilder.DropTable(
                name: "Evenements");
        }
    }
}
