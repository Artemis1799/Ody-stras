using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class updateAttributeName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Picture_name",
                table: "Photos",
                newName: "PictureName");

            migrationBuilder.RenameColumn(
                name: "Date_debut",
                table: "Evenements",
                newName: "DateDebut");

            migrationBuilder.RenameColumn(
                name: "Stock_total",
                table: "Equipments",
                newName: "StockTotal");

            migrationBuilder.RenameColumn(
                name: "Stock_restant",
                table: "Equipments",
                newName: "StockRestant");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "PictureName",
                table: "Photos",
                newName: "Picture_name");

            migrationBuilder.RenameColumn(
                name: "DateDebut",
                table: "Evenements",
                newName: "Date_debut");

            migrationBuilder.RenameColumn(
                name: "StockTotal",
                table: "Equipments",
                newName: "Stock_total");

            migrationBuilder.RenameColumn(
                name: "StockRestant",
                table: "Equipments",
                newName: "Stock_restant");
        }
    }
}
