const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const samplePath = path.join(process.cwd(), "data", "sample-products.json");

async function main() {
  if (!fs.existsSync(samplePath)) {
    throw new Error(`Sample file not found at ${samplePath}`);
  }

  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log("Seed skipped: products already exist.");
    return;
  }

  const sample = JSON.parse(fs.readFileSync(samplePath, "utf8"));
  for (const row of sample) {
    await prisma.product.create({
      data: {
        name: row.name,
        slug: row.slug,
        sku: row.sku,
        description: row.description || "",
        category: row.category || "Straight",
        price: Number(row.price || 0),
        availability: row.availability || "In Stock",
        stockQty: Number(row.stock_qty || 0),
        lowStockThreshold: Number(row.low_stock_threshold || 2),
        laceType: row.lace_type || "Closure",
        density: row.density || "180%",
        capSize: row.cap_size || "Medium",
        colorsJson: JSON.stringify(row.colors || []),
        lengthsJson: JSON.stringify(row.lengths || []),
        mediaJson: JSON.stringify(row.media || [])
      }
    });
  }
  console.log(`Seed complete: ${sample.length} products created.`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

