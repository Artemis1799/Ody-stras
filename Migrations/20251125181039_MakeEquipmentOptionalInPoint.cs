using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace t5_back.Migrations
{
    /// <inheritdoc />
    public partial class MakeEquipmentOptionalInPoint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Points_Equipments_EquipmentId",
                table: "Points");

            migrationBuilder.AlterColumn<Guid>(
                name: "EquipmentId",
                table: "Points",
                type: "TEXT",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "TEXT");

            migrationBuilder.AddForeignKey(
                name: "FK_Points_Equipments_EquipmentId",
                table: "Points",
                column: "EquipmentId",
                principalTable: "Equipments",
                principalColumn: "UUID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Points_Equipments_EquipmentId",
                table: "Points");

            migrationBuilder.AlterColumn<Guid>(
                name: "EquipmentId",
                table: "Points",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "TEXT",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Points_Equipments_EquipmentId",
                table: "Points",
                column: "EquipmentId",
                principalTable: "Equipments",
                principalColumn: "UUID",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
