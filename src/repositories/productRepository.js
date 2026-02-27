const { prisma } = require("../db");

function mapProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    sku: row.sku,
    description: row.description,
    category: row.category,
    price: row.price,
    availability: row.availability,
    stock_qty: row.stockQty,
    low_stock_threshold: row.lowStockThreshold,
    lace_type: row.laceType,
    density: row.density,
    cap_size: row.capSize,
    colors_json: row.colorsJson,
    lengths_json: row.lengthsJson,
    media_json: row.mediaJson,
    colors: JSON.parse(row.colorsJson || "[]"),
    lengths: JSON.parse(row.lengthsJson || "[]"),
    media: JSON.parse(row.mediaJson || "[]"),
    created_at: row.createdAt,
    updated_at: row.updatedAt
  };
}

function buildWhere(filters = {}) {
  const where = {};
  if (filters.category) where.category = filters.category;
  if (filters.availability) where.availability = filters.availability;
  if (filters.laceType) where.laceType = filters.laceType;
  if (filters.minPrice) where.price = { ...(where.price || {}), gte: Number(filters.minPrice) };
  if (filters.maxPrice) where.price = { ...(where.price || {}), lte: Number(filters.maxPrice) };
  if (filters.color) where.colorsJson = { contains: filters.color };
  if (filters.length) where.lengthsJson = { contains: filters.length };
  return where;
}

async function listProducts(filters = {}) {
  const { page = 1, pageSize = 9 } = filters;
  const where = buildWhere(filters);
  const skip = (Number(page) - 1) * Number(pageSize);

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(pageSize)
    })
  ]);

  return {
    items: rows.map(mapProduct),
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.max(1, Math.ceil(total / Number(pageSize)))
  };
}

async function listFeatured(limit = 4) {
  const rows = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    take: Number(limit)
  });
  return rows.map(mapProduct);
}

async function getBySlug(slug) {
  const row = await prisma.product.findUnique({ where: { slug } });
  return mapProduct(row);
}

async function getById(id) {
  const row = await prisma.product.findUnique({ where: { id: Number(id) } });
  return mapProduct(row);
}

async function createProduct(payload) {
  const row = await prisma.product.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      sku: payload.sku,
      description: payload.description,
      category: payload.category,
      price: Number(payload.price || 0),
      availability: payload.availability,
      stockQty: Number(payload.stock_qty || 0),
      lowStockThreshold: Number(payload.low_stock_threshold || 0),
      laceType: payload.lace_type,
      density: payload.density,
      capSize: payload.cap_size,
      colorsJson: payload.colors_json || "[]",
      lengthsJson: payload.lengths_json || "[]",
      mediaJson: payload.media_json || "[]"
    }
  });
  return mapProduct(row);
}

async function updateProduct(id, payload) {
  const row = await prisma.product.update({
    where: { id: Number(id) },
    data: {
      name: payload.name,
      slug: payload.slug,
      sku: payload.sku,
      description: payload.description,
      category: payload.category,
      price: Number(payload.price || 0),
      availability: payload.availability,
      stockQty: Number(payload.stock_qty || 0),
      lowStockThreshold: Number(payload.low_stock_threshold || 0),
      laceType: payload.lace_type,
      density: payload.density,
      capSize: payload.cap_size,
      colorsJson: payload.colors_json || "[]",
      lengthsJson: payload.lengths_json || "[]",
      mediaJson: payload.media_json || "[]"
    }
  });
  return mapProduct(row);
}

async function deleteProduct(id) {
  return prisma.product.delete({ where: { id: Number(id) } });
}

async function reduceStock(id, quantity) {
  const product = await prisma.product.findUnique({ where: { id: Number(id) } });
  if (!product) return null;

  const nextQty = Math.max(Number(product.stockQty || 0) - Number(quantity || 0), 0);
  let nextAvailability = "In Stock";
  if (nextQty <= 0) nextAvailability = "Sold Out";
  else if (nextQty <= Number(product.lowStockThreshold || 0)) nextAvailability = "Low Stock";

  const row = await prisma.product.update({
    where: { id: Number(id) },
    data: {
      stockQty: nextQty,
      availability: nextAvailability
    }
  });

  return mapProduct(row);
}

async function listAdmin() {
  const rows = await prisma.product.findMany({ orderBy: { updatedAt: "desc" } });
  return rows.map(mapProduct);
}

module.exports = {
  listProducts,
  listFeatured,
  getBySlug,
  getById,
  createProduct,
  updateProduct,
  deleteProduct,
  reduceStock,
  listAdmin
};

