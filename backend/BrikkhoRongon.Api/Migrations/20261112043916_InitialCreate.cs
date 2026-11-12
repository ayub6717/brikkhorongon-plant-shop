using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BrikkhoRongon.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "products",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false),
                    Slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Category = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    NameBn = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    DescriptionEn = table.Column<string>(type: "text", nullable: false),
                    DescriptionBn = table.Column<string>(type: "text", nullable: false),
                    ImageSrc = table.Column<string>(type: "text", nullable: false),
                    ImageWidth = table.Column<int>(type: "integer", nullable: false),
                    ImageHeight = table.Column<int>(type: "integer", nullable: false),
                    Light = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Water = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Difficulty = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Featured = table.Column<bool>(type: "boolean", nullable: false),
                    NeedsReview = table.Column<bool>(type: "boolean", nullable: false),
                    BonsaiStyle = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    BonsaiAgeYears = table.Column<int>(type: "integer", nullable: true),
                    BonsaiHeightCm = table.Column<int>(type: "integer", nullable: true),
                    BonsaiPlacement = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_products", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_products_Category",
                table: "products",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_products_Slug",
                table: "products",
                column: "Slug",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "products");
        }
    }
}
