const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const appConfig = require("../config/app");
const brand = require("../config/brand");
const { requireAdmin } = require("../middleware/auth");
const products = require("../repositories/productRepository");
const orders = require("../repositories/orderRepository");
const { slugify, parseCsvList } = require("../utils/format");
const { uploadBufferToBucket } = require("../utils/storage");

const router = express.Router();
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const upload = multer({ storage: multer.memoryStorage() });

async function parseProductBody(req, existingMedia = []) {
  const files = req.files || {};
  const bucket = appConfig.supabase.buckets.products;

  const newImages = await Promise.all(
    (files.images || []).map(async (file) => {
      const publicUrl = await uploadBufferToBucket({
        bucket,
        file,
        folder: "images"
      });
      return {
        type: "image",
        path: publicUrl,
        alt: req.body.name || "Product image"
      };
    })
  );

  const newVideo = files.video?.[0]
    ? [
        {
          type: "video",
          path: await uploadBufferToBucket({
            bucket,
            file: files.video[0],
            folder: "videos"
          })
        }
      ]
    : [];

  const newModel = files.model?.[0]
    ? [
        {
          type: "model",
          path: await uploadBufferToBucket({
            bucket,
            file: files.model[0],
            folder: "models"
          })
        }
      ]
    : [];

  const keepExisting = req.body.keepExistingMedia === "on";
  const media = keepExisting ? [...existingMedia, ...newImages, ...newVideo, ...newModel] : [...newImages, ...newVideo, ...newModel];

  return {
    name: (req.body.name || "").trim(),
    slug: slugify(req.body.slug || req.body.name),
    sku: (req.body.sku || "").trim(),
    description: (req.body.description || "").trim(),
    category: req.body.category || "Straight",
    price: Number(req.body.price || 0),
    availability: req.body.availability || "In Stock",
    stock_qty: Number(req.body.stock_qty || 0),
    low_stock_threshold: Number(req.body.low_stock_threshold || 2),
    lace_type: req.body.lace_type || "Closure",
    density: (req.body.density || "180%").trim(),
    cap_size: req.body.cap_size || "Medium",
    colors_json: JSON.stringify(parseCsvList(req.body.colors)),
    lengths_json: JSON.stringify(parseCsvList(req.body.lengths)),
    media_json: JSON.stringify(media)
  };
}

router.get("/login", (req, res) => {
  if (req.isAdminAuthenticated) return res.redirect("/admin");
  res.render("admin/login", {
    title: `Admin Login | ${brand.brandName}`,
    layout: "layouts/admin",
    error: null
  });
});

router.post("/login", (req, res) => {
  if ((req.body.password || "") === appConfig.adminPassword) {
    const token = jwt.sign({ isAdmin: true }, appConfig.jwtSecret, { expiresIn: "12h" });
    res.cookie(appConfig.auth.adminCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000
    });
    return res.redirect("/admin");
  }
  res.status(401).render("admin/login", {
    title: `Admin Login | ${brand.brandName}`,
    layout: "layouts/admin",
    error: "Invalid password."
  });
});

router.post("/logout", requireAdmin, (req, res) => {
  res.clearCookie(appConfig.auth.adminCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax"
  });
  res.redirect("/admin/login");
});

router.get("/", requireAdmin, asyncHandler(async (req, res) => {
  try {
    const [adminProducts, adminOrders] = await Promise.all([products.listAdmin(), orders.listOrders()]);
    res.render("admin/dashboard", {
      title: `Admin Dashboard | ${brand.brandName}`,
      layout: "layouts/admin",
      products: adminProducts,
      orders: adminOrders
    });
  } catch (_error) {
    res.status(500).render("admin/dashboard", {
      title: `Admin Dashboard | ${brand.brandName}`,
      layout: "layouts/admin",
      products: [],
      orders: []
    });
  }
}));

router.get("/products/new", requireAdmin, (req, res) => {
  res.render("admin/product-form", {
    title: `Add Product | ${brand.brandName}`,
    layout: "layouts/admin",
    product: null,
    error: null
  });
});

router.post(
  "/products",
  requireAdmin,
  upload.fields([
    { name: "images", maxCount: 8 },
    { name: "video", maxCount: 1 },
    { name: "model", maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    try {
      const payload = await parseProductBody(req, []);
      if (!payload.name || !payload.sku || !payload.slug) {
        throw new Error("Name, SKU, and slug are required.");
      }
      await products.createProduct(payload);
      res.redirect("/admin");
    } catch (error) {
      const fileSummary = {
        images: (req.files?.images || []).map((f) => ({
          name: f.originalname,
          mimeType: f.mimetype,
          size: f.size
        })),
        video: (req.files?.video || []).map((f) => ({
          name: f.originalname,
          mimeType: f.mimetype,
          size: f.size
        })),
        model: (req.files?.model || []).map((f) => ({
          name: f.originalname,
          mimeType: f.mimetype,
          size: f.size
        }))
      };
      console.error("[Admin Products] create upload failure", {
        bucket: appConfig.supabase.buckets.products,
        fileSummary,
        errorMessage: error.message
      });
      res.status(400).render("admin/product-form", {
        title: `Add Product | ${brand.brandName}`,
        layout: "layouts/admin",
        product: null,
        error: error.message
      });
    }
  })
);

router.get("/products/:id/edit", requireAdmin, asyncHandler(async (req, res) => {
  const product = await products.getById(req.params.id);
  if (!product) return res.redirect("/admin");
  res.render("admin/product-form", {
    title: `Edit Product | ${brand.brandName}`,
    layout: "layouts/admin",
    product,
    error: null
  });
}));

router.post(
  "/products/:id",
  requireAdmin,
  upload.fields([
    { name: "images", maxCount: 8 },
    { name: "video", maxCount: 1 },
    { name: "model", maxCount: 1 }
  ]),
  asyncHandler(async (req, res) => {
    const existing = await products.getById(req.params.id);
    if (!existing) return res.redirect("/admin");
    try {
      const payload = await parseProductBody(req, existing.media);
      if (!payload.name || !payload.sku || !payload.slug) {
        throw new Error("Name, SKU, and slug are required.");
      }
      await products.updateProduct(req.params.id, payload);
      res.redirect("/admin");
    } catch (error) {
      const fileSummary = {
        images: (req.files?.images || []).map((f) => ({
          name: f.originalname,
          mimeType: f.mimetype,
          size: f.size
        })),
        video: (req.files?.video || []).map((f) => ({
          name: f.originalname,
          mimeType: f.mimetype,
          size: f.size
        })),
        model: (req.files?.model || []).map((f) => ({
          name: f.originalname,
          mimeType: f.mimetype,
          size: f.size
        }))
      };
      console.error("[Admin Products] update upload failure", {
        bucket: appConfig.supabase.buckets.products,
        fileSummary,
        errorMessage: error.message
      });
      res.status(400).render("admin/product-form", {
        title: `Edit Product | ${brand.brandName}`,
        layout: "layouts/admin",
        product: existing,
        error: error.message
      });
    }
  })
);

router.post("/products/:id/delete", requireAdmin, asyncHandler(async (req, res) => {
  await products.deleteProduct(req.params.id);
  res.redirect("/admin");
}));

router.post("/orders/:id/status", requireAdmin, asyncHandler(async (req, res) => {
  const status = req.body.status || "New";
  await orders.updateStatus(req.params.id, status);
  res.redirect("/admin");
}));

module.exports = router;
