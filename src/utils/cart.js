const CART_COOKIE_NAME = "cart_payload";

function parseCartFromCookie(req) {
  const raw = req.signedCookies?.[CART_COOKIE_NAME];
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
        color: String(item.color || "Default"),
        length: String(item.length || "Default")
      }))
      .filter((item) => Number.isInteger(item.productId) && item.productId > 0 && item.quantity > 0);
  } catch (_error) {
    return [];
  }
}

function writeCartCookie(res, cart) {
  const safeCart = Array.isArray(cart) ? cart : [];
  res.cookie(CART_COOKIE_NAME, JSON.stringify(safeCart), {
    signed: true,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

module.exports = {
  CART_COOKIE_NAME,
  parseCartFromCookie,
  writeCartCookie
};

