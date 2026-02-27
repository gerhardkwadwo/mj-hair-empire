require("dotenv").config();

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");
const brand = require("./config/brand");
const appConfig = require("./config/app");
const storeRoutes = require("./routes/store");
const adminRoutes = require("./routes/admin");
const { formatCurrency } = require("./utils/format");
const { attachAdminAuth } = require("./middleware/auth");
const { parseCartFromCookie } = require("./utils/cart");
const { prisma } = require("./db");

const app = express();
app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/main");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser(appConfig.sessionSecret));
app.use(attachAdminAuth);

app.use("/css", express.static(path.join(__dirname, "public", "css")));
app.use("/js", express.static(path.join(__dirname, "public", "js")));
app.use("/images", express.static(path.join(__dirname, "public", "images")));

app.use((req, res, next) => {
  res.locals.brand = brand;
  res.locals.formatCurrency = formatCurrency;
  res.locals.currentPath = req.path;
  res.locals.isAdminAuthenticated = Boolean(req.isAdminAuthenticated);
  next();
});

app.use("/", storeRoutes);
app.use("/admin", adminRoutes);

app.use((err, req, res, _next) => {
  console.error(`Request error: ${err.message}`);
  if (req.path.startsWith("/admin")) {
    return res.status(500).render("admin/login", {
      title: `Admin | ${brand.brandName}`,
      layout: "layouts/admin",
      error: "Something went wrong. Please try again."
    });
  }
  return res.status(500).render("store/not-found", {
    title: "Server Error",
    metaDescription: "Unexpected error.",
    cartCount: 0
  });
});

app.use((req, res) => {
  const cart = parseCartFromCookie(req);
  res.status(404).render("store/not-found", {
    title: "Page Not Found",
    metaDescription: "The page you are looking for was not found.",
    cartCount: cart.reduce((sum, item) => sum + item.quantity, 0)
  });
});

async function start() {
  await prisma.$connect();
  app.listen(appConfig.port, () => {
    console.log(`${brand.brandName} running on http://localhost:${appConfig.port}`);
  });
}

start().catch((error) => {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
});
