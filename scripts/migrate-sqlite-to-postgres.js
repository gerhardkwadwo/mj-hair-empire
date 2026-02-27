const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const sqlitePath = path.join(process.cwd(), "data", "app.db");

function toNullable(value) {
  return value === undefined || value === null || value === "" ? null : value;
}

async function migrateProducts(sqlite) {
  const rows = sqlite.prepare("SELECT * FROM products ORDER BY id ASC").all();
  for (const row of rows) {
    await prisma.product.upsert({
      where: { slug: row.slug },
      update: {
        name: row.name,
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
        colorsJson: row.colors_json || "[]",
        lengthsJson: row.lengths_json || "[]",
        mediaJson: row.media_json || "[]"
      },
      create: {
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
        colorsJson: row.colors_json || "[]",
        lengthsJson: row.lengths_json || "[]",
        mediaJson: row.media_json || "[]"
      }
    });
  }
  return rows.length;
}

async function migrateOrders(sqlite) {
  const rows = sqlite.prepare("SELECT * FROM orders ORDER BY id ASC").all();
  for (const row of rows) {
    await prisma.order.upsert({
      where: { orderId: row.order_id },
      update: {
        customerName: row.customer_name,
        phoneNumber: row.phone_number,
        deliveryType: row.delivery_type || "Pickup",
        deliveryAddress: toNullable(row.delivery_address),
        notes: toNullable(row.notes),
        paymentProofPath: toNullable(row.payment_proof_path),
        subtotal: Number(row.subtotal || 0),
        status: row.status || "New",
        itemsJson: row.items_json || "[]"
      },
      create: {
        orderId: row.order_id,
        customerName: row.customer_name,
        phoneNumber: row.phone_number,
        deliveryType: row.delivery_type || "Pickup",
        deliveryAddress: toNullable(row.delivery_address),
        notes: toNullable(row.notes),
        paymentProofPath: toNullable(row.payment_proof_path),
        subtotal: Number(row.subtotal || 0),
        status: row.status || "New",
        itemsJson: row.items_json || "[]"
      }
    });
  }
  return rows.length;
}

async function main() {
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`SQLite database not found at ${sqlitePath}`);
  }

  const sqlite = new Database(sqlitePath, { readonly: true });
  try {
    const [productCount, orderCount] = await Promise.all([
      migrateProducts(sqlite),
      migrateOrders(sqlite)
    ]);
    console.log(`Migration complete. Products: ${productCount}, Orders: ${orderCount}`);
  } finally {
    sqlite.close();
  }
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

