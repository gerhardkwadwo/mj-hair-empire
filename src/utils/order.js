const crypto = require("crypto");

function generateOrderId() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `MJ-${y}${m}${d}-${suffix}`;
}

module.exports = { generateOrderId };

