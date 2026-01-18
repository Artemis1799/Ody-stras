using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class deletespeedtopath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FastestEstimatedSpeed",
                table: "Paths");

            migrationBuilder.DropColumn(
                name: "SlowestEstimatedSpeed",
                table: "Paths");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "FastestEstimatedSpeed",
                table: "Paths",
                type: "REAL",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "SlowestEstimatedSpeed",
                table: "Paths",
                type: "REAL",
                nullable: false,
                defaultValue: 0f);
        }
    }
}
