using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class AddUserTeamMemberModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "TeamId",
                table: "Events",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Members",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    FirstName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Members", x => x.UUID);
                });

            migrationBuilder.CreateTable(
                name: "Teams",
                columns: table => new
                {
                    UUID = table.Column<Guid>(type: "TEXT", nullable: false),
                    TeamName = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Teams", x => x.UUID);
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
                name: "TeamUsers",
                columns: table => new
                {
                    TeamId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UserId = table.Column<Guid>(type: "TEXT", nullable: false),
                    MemberId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TeamUsers", x => new { x.TeamId, x.UserId, x.MemberId });
                    table.ForeignKey(
                        name: "FK_TeamUsers_Members_MemberId",
                        column: x => x.MemberId,
                        principalTable: "Members",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TeamUsers_Teams_TeamId",
                        column: x => x.TeamId,
                        principalTable: "Teams",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TeamUsers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UUID",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Events_TeamId",
                table: "Events",
                column: "TeamId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamUsers_MemberId",
                table: "TeamUsers",
                column: "MemberId");

            migrationBuilder.CreateIndex(
                name: "IX_TeamUsers_UserId",
                table: "TeamUsers",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Events_Teams_TeamId",
                table: "Events",
                column: "TeamId",
                principalTable: "Teams",
                principalColumn: "UUID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Events_Teams_TeamId",
                table: "Events");

            migrationBuilder.DropTable(
                name: "TeamUsers");

            migrationBuilder.DropTable(
                name: "Members");

            migrationBuilder.DropTable(
                name: "Teams");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Events_TeamId",
                table: "Events");

            migrationBuilder.DropColumn(
                name: "TeamId",
                table: "Events");
        }
    }
}
