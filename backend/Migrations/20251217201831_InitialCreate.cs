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
                name: "Employees",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    LastName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    FirstName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Email = table.Column<string>(type: "TEXT", maxLength: 60, nullable: true),
                    Phone = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.UUID);
                });

            migrationBuilder.CreateTable(
                name: "Equipments",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Length = table.Column<float>(type: "REAL", nullable: true),
                    Description = table.Column<string>(type: "TEXT", nullable: true),
                    StorageType = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipments", x => x.UUID);
                });

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EndDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.UUID);
                });

            migrationBuilder.CreateTable(
                name: "Pictures",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    PictureData = table.Column<byte[]>(type: "BLOB", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Pictures", x => x.UUID);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Password = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UUID);
                });

            migrationBuilder.CreateTable(
                name: "Areas",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    EventId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: true),
                    ColorHex = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    GeoJson = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Areas", x => x.UUID);
                    table.ForeignKey(
                        name: "FK_Areas_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Paths",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    EventId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    ColorHex = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    StartDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FastestEstimatedSpeed = table.Column<float>(type: "REAL", nullable: false),
                    SlowestEstimatedSpeed = table.Column<float>(type: "REAL", nullable: false),
                    GeoJson = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Paths", x => x.UUID);
                    table.ForeignKey(
                        name: "FK_Paths_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Points",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    EventId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    Latitude = table.Column<float>(type: "REAL", nullable: false),
                    Longitude = table.Column<float>(type: "REAL", nullable: false),
                    Comment = table.Column<string>(type: "TEXT", nullable: true),
                    Order = table.Column<int>(type: "INTEGER", nullable: true),
                    Validated = table.Column<bool>(type: "INTEGER", nullable: false),
                    EquipmentId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Points", x => x.UUID);
                    table.ForeignKey(
                        name: "FK_Points_Equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipments",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Points_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SecurityZones",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    EventId = table.Column<Guid>(type: "TEXT", nullable: false),
                    EquipmentId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Quantity = table.Column<int>(type: "INTEGER", nullable: false),
                    InstallationDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    RemovalDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    GeoJson = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityZones", x => x.UUID);
                    table.ForeignKey(
                        name: "FK_SecurityZones_Equipments_EquipmentId",
                        column: x => x.EquipmentId,
                        principalTable: "Equipments",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SecurityZones_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    EventId = table.Column<Guid>(type: "TEXT", nullable: false),
                    TeamName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    TeamNumber = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teams", x => x.UUID);
                    table.ForeignKey(
                        name: "FK_Teams_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.CreateTable(
                name: "Plannings",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    TeamId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plannings", x => x.UUID);
                    table.ForeignKey(
                        name: "FK_Plannings_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TeamEmployees",
                columns: table => new
                {
                    TeamId = table.Column<Guid>(type: "TEXT", nullable: false),
                    EmployeeId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamEmployees", x => new { x.TeamId, x.EmployeeId });
                    table.ForeignKey(
                        name: "FK_TeamEmployees_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TeamEmployees_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Actions",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    PlanningId = table.Column<Guid>(type: "TEXT", nullable: false),
                    SecurityZoneId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    Date = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Longitude = table.Column<float>(type: "REAL", nullable: false),
                    Latitude = table.Column<float>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Actions", x => x.UUID);
                    table.ForeignKey(
                        name: "FK_Actions_Plannings_PlanningId",
                        column: x => x.PlanningId,
                        principalTable: "Plannings",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Actions_SecurityZones_SecurityZoneId",
                        column: x => x.SecurityZoneId,
                        principalTable: "SecurityZones",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Actions_PlanningId",
                table: "Actions",
                column: "PlanningId");

            migrationBuilder.CreateIndex(
                name: "IX_Actions_SecurityZoneId",
                table: "Actions",
                column: "SecurityZoneId");

            migrationBuilder.CreateIndex(
                name: "IX_Areas_EventId",
                table: "Areas",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_Paths_EventId",
                table: "Paths",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_PicturePoints_PointId",
                table: "PicturePoints",
                column: "PointId");

            migrationBuilder.CreateIndex(
                name: "IX_Plannings_TeamId",
                table: "Plannings",
                column: "TeamId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Points_EquipmentId",
                table: "Points",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_Points_EventId",
                table: "Points",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityZones_EquipmentId",
                table: "SecurityZones",
                column: "EquipmentId");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityZones_EventId",
                table: "SecurityZones",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamEmployees_EmployeeId",
                table: "TeamEmployees",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Teams_EventId",
                table: "Teams",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_Name",
                table: "Users",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Actions");

            migrationBuilder.DropTable(
                name: "Areas");

            migrationBuilder.DropTable(
                name: "Paths");

            migrationBuilder.DropTable(
                name: "PicturePoints");

            migrationBuilder.DropTable(
                name: "TeamEmployees");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Plannings");

            migrationBuilder.DropTable(
                name: "SecurityZones");

            migrationBuilder.DropTable(
                name: "Pictures");

            migrationBuilder.DropTable(
                name: "Points");

            migrationBuilder.DropTable(
                name: "Employees");

            migrationBuilder.DropTable(
                name: "Teams");

            migrationBuilder.DropTable(
                name: "Equipments");

            migrationBuilder.DropTable(
                name: "Events");
        }
    }
}
