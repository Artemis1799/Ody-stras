using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class RenameGeometryJsonColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Properties",
                table: "Geometries",
                newName: "PropertiesString");

            migrationBuilder.RenameColumn(
                name: "GeoJson",
                table: "Geometries",
                newName: "GeoJsonString");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PropertiesString",
                table: "Geometries",
                newName: "Properties");

            migrationBuilder.RenameColumn(
                name: "GeoJsonString",
                table: "Geometries",
                newName: "GeoJson");
        }
    }
}
