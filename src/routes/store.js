const express = require("express");
const multer = require("multer");
const brand = require("../config/brand");
const appConfig = require("../config/app");
const products = require("../repositories/productRepository");
const orders = require("../repositories/orderRepository");
const { formatCurrency, whatsappUrl } = require("../utils/format");
const { generateOrderId } = require("../utils/order");
const { uploadBufferToBucket } = require("../utils/storage");
const { parseCartFromCookie, writeCartCookie } = require("../utils/cart");

const router = express.Router();
const paymentUpload = multer({ storage: multer.memoryStorage() });
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function buildOrderWhatsappMessage(order) {
  const lines = [
    `Hello ${brand.brandName}, I have placed an order.`,
    `Order ID: ${order.order_id}`,
    `Name: ${order.customer_name}`,
    `Phone: ${order.phone_number}`,
    `Delivery Type: ${order.delivery_type}`,
    `Delivery Address: ${order.delivery_address || "-"}`,
    `Notes: ${order.notes || "-"}`,
    "Items:"
  ];

  order.items.forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.productName} | Color: ${item.color} | Length: ${item.length}" | Qty: ${item.quantity} | ${formatCurrency(item.unitPrice)}`
    );
  });
  lines.push(`Subtotal: ${formatCurrency(order.subtotal)}`);
  if (order.payment_proof_path) {
    lines.push(`Payment Proof: ${order.payment_proof_path}`);
  }

  return whatsappUrl(brand.whatsappNumber, lines.join("\n"));
}

async function enrichCart(cart) {
  const enriched = await Promise.all(
    cart.map(async (item) => {
      const product = await products.getById(item.productId);
      if (!product) return null;
      return {
        ...item,
        product,
        lineTotal: Number(product.price) * Number(item.quantity)
      };
    })
  );
  return enriched.filter(Boolean);
}

async function cartSummary(req) {
  const cart = parseCartFromCookie(req);
  const items = await enrichCart(cart);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  return { cart, items, subtotal };
}

router.get("/", asyncHandler(async (req, res) => {
  const [featured, cart] = await Promise.all([
    products.listFeatured(4),
    Promise.resolve(parseCartFromCookie(req))
  ]);

  res.render("store/home", {
    title: `${brand.brandName} | ${brand.tagline}`,
    metaDescription: `${brand.tagline} Premium wigs in Accra, Ghana.`,
    featured,
    categories: ["Straight", "Body Wave", "Curly", "Bob", "Frontal", "Closure"],
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  });
}));

router.get("/shop", asyncHandler(async (req, res) => {
  const { category, availability, color, length, minPrice, maxPrice, laceType, page = 1 } = req.query;
  const result = await products.listProducts({
    category,
    availability,
    color,
    length,
    minPrice,
    maxPrice,
    laceType,
    page: Number(page),
    pageSize: 9
  });

  const cart = parseCartFromCookie(req);
  res.render("store/shop", {
    title: `Shop | ${brand.brandName}`,
    metaDescription: `Browse luxury wigs from ${brand.brandName}.`,
    result,
    filters: { category, availability, color, length, minPrice, maxPrice, laceType },
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  });
}));

router.get("/product/:slug", asyncHandler(async (req, res) => {
  const product = await products.getBySlug(req.params.slug);
  if (!product) return res.status(404).render("store/not-found", { title: "Product Not Found", cartCount: 0 });

  const defaultImage = product.media.find((m) => m.type === "image");
  const waLink = whatsappUrl(
    brand.whatsappNumber,
    `Hello ${brand.brandName}, I'm interested in ${product.name} (${product.sku}) for ${formatCurrency(product.price)}.`
  );

  const cart = parseCartFromCookie(req);
  res.render("store/product", {
    title: `${product.name} | ${brand.brandName}`,
    metaDescription: product.description,
    product,
    defaultImage,
    waLink,
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  });
}));

router.get("/cart", asyncHandler(async (req, res) => {
  const summary = await cartSummary(req);
  res.render("store/cart", {
    title: `Cart | ${brand.brandName}`,
    metaDescription: `Review your cart at ${brand.brandName}.`,
    ...summary,
    cartCount: summary.items.reduce((sum, item) => sum + item.quantity, 0)
  });
}));

router.post("/cart/add", asyncHandler(async (req, res) => {
  const product = await products.getById(req.body.productId);
  if (!product) return res.redirect("/shop");
  if (product.stock_qty <= 0 || product.availability === "Sold Out") {
    return res.redirect(`/product/${product.slug}`);
  }

  const quantity = Math.min(Math.max(1, Number(req.body.quantity || 1)), Math.max(product.stock_qty, 1));
  const color = req.body.color || product.colors[0] || "Default";
  const length = req.body.length || product.lengths[0] || "Default";

  const cart = parseCartFromCookie(req);
  const existing = cart.find(
    (item) => item.productId === product.id && item.color === color && item.length === length
  );
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, product.stock_qty);
  } else {
    cart.push({ productId: product.id, quantity, color, length });
  }

  writeCartCookie(res, cart);
  res.redirect("/cart");
}));

router.post("/cart/update", asyncHandler(async (req, res) => {
  const cart = parseCartFromCookie(req);
  const { key, quantity } = req.body;
  const qty = Math.max(0, Number(quantity || 0));
  const index = Number(key);
  if (Number.isInteger(index) && cart[index]) {
    if (qty === 0) cart.splice(index, 1);
    else {
      const product = await products.getById(cart[index].productId);
      const maxQty = product ? Math.max(product.stock_qty, 1) : qty;
      cart[index].quantity = Math.min(qty, maxQty);
    }
  }
  writeCartCookie(res, cart);
  res.redirect("/cart");
}));

router.post("/cart/remove", (req, res) => {
  const cart = parseCartFromCookie(req);
  const index = Number(req.body.key);
  if (Number.isInteger(index) && cart[index]) {
    cart.splice(index, 1);
  }
  writeCartCookie(res, cart);
  res.redirect("/cart");
});

router.get("/checkout", asyncHandler(async (req, res) => {
  const summary = await cartSummary(req);
  if (!summary.items.length) return res.redirect("/shop");

  res.render("store/checkout", {
    title: `Checkout | ${brand.brandName}`,
    metaDescription: `Checkout order for ${brand.brandName}.`,
    ...summary,
    cartCount: summary.items.reduce((sum, item) => sum + item.quantity, 0),
    formData: {}
  });
}));

router.post("/checkout", paymentUpload.single("paymentProof"), async (req, res) => {
  try {
    const summary = await cartSummary(req);
    if (!summary.items.length) return res.redirect("/shop");

    const unavailableItem = summary.items.find(
      (item) => item.quantity > item.product.stock_qty || item.product.availability === "Sold Out"
    );
    if (unavailableItem) {
      return res.status(400).render("store/checkout", {
        title: `Checkout | ${brand.brandName}`,
        metaDescription: `Checkout order for ${brand.brandName}.`,
        ...summary,
        cartCount: summary.items.reduce((sum, item) => sum + item.quantity, 0),
        formData: req.body || {},
        error: `The selected quantity for ${unavailableItem.product.name} is no longer available.`
      });
    }

    const form = {
      fullName: (req.body.fullName || "").trim(),
      phoneNumber: (req.body.phoneNumber || "").trim(),
      deliveryType: req.body.deliveryType || "Pickup",
      deliveryAddress: (req.body.deliveryAddress || "").trim(),
      notes: (req.body.notes || "").trim()
    };

    if (!form.fullName || !form.phoneNumber) {
      return res.status(400).render("store/checkout", {
        title: `Checkout | ${brand.brandName}`,
        metaDescription: `Checkout order for ${brand.brandName}.`,
        ...summary,
        cartCount: summary.items.reduce((sum, item) => sum + item.quantity, 0),
        formData: form,
        error: "Full Name and Phone Number are required."
      });
    }

    if (form.deliveryType === "Delivery" && !form.deliveryAddress) {
      return res.status(400).render("store/checkout", {
        title: `Checkout | ${brand.brandName}`,
        metaDescription: `Checkout order for ${brand.brandName}.`,
        ...summary,
        cartCount: summary.items.reduce((sum, item) => sum + item.quantity, 0),
        formData: form,
        error: "Delivery address is required for delivery orders."
      });
    }

    const items = summary.items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      color: item.color,
      length: item.length,
      quantity: item.quantity,
      unitPrice: item.product.price,
      lineTotal: item.lineTotal
    }));

    let paymentProofUrl = "";
    if (req.file) {
      paymentProofUrl = await uploadBufferToBucket({
        bucket: appConfig.supabase.buckets.payments,
        file: req.file,
        folder: "proofs"
      });
      if (!paymentProofUrl) {
        throw new Error("Payment proof uploaded but no URL was returned.");
      }
      paymentProofUrl = String(paymentProofUrl).trim();
    }

    const order = await orders.createOrder({
      order_id: generateOrderId(),
      customer_name: form.fullName,
      phone_number: form.phoneNumber,
      delivery_type: form.deliveryType,
      delivery_address: form.deliveryType === "Delivery" ? form.deliveryAddress : "",
      notes: form.notes,
      paymentProofPath: paymentProofUrl,
      payment_proof_path: paymentProofUrl,
      subtotal: summary.subtotal,
      status: "New",
      items_json: JSON.stringify(items)
    });

    await Promise.all(items.map((item) => products.reduceStock(item.productId, item.quantity)));
    writeCartCookie(res, []);
    res.redirect(`/order/${order.order_id}`);
  } catch (_error) {
    const summary = await cartSummary(req);
    return res.status(500).render("store/checkout", {
      title: `Checkout | ${brand.brandName}`,
      metaDescription: `Checkout order for ${brand.brandName}.`,
      ...summary,
      cartCount: summary.items.reduce((sum, item) => sum + item.quantity, 0),
      formData: req.body || {},
      error: "We could not process your order right now. Please try again."
    });
  }
});

router.get("/order/:orderId", asyncHandler(async (req, res) => {
  const order = await orders.getByOrderId(req.params.orderId);
  if (!order) return res.status(404).render("store/not-found", { title: "Order Not Found", cartCount: 0 });

  const cart = parseCartFromCookie(req);
  res.render("store/confirmation", {
    title: `Order ${order.order_id} | ${brand.brandName}`,
    metaDescription: `Order confirmation for ${order.order_id}.`,
    order,
    orderWhatsappLink: buildOrderWhatsappMessage(order),
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  });
}));

router.get("/sitemap.xml", asyncHandler(async (req, res) => {
  const all = (await products.listProducts({ page: 1, pageSize: 1000 })).items;
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const urls = ["/", "/shop", "/cart", ...all.map((p) => `/product/${p.slug}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${baseUrl}${url}</loc></url>`).join("\n")}
</urlset>`;
  res.type("application/xml").send(xml);
}));

router.get("/robots.txt", (_req, res) => {
  res.type("text/plain").send("User-agent: *\nAllow: /\nSitemap: /sitemap.xml\n");
});

module.exports = router;
