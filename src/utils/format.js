const brand = require("../config/brand");

function formatCurrency(amount) {
  return new Intl.NumberFormat(brand.currencyLocale, {
    style: "currency",
    currency: brand.currency,
    maximumFractionDigits: 2
  }).format(Number(amount || 0));
}

function slugify(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function parseCsvList(value) {
  if (!value) return [];
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function whatsappUrl(phone, message) {
  const clean = String(phone || "").replace(/[^\d]/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

module.exports = {
  formatCurrency,
  slugify,
  parseCsvList,
  whatsappUrl
};

