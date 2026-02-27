const { validateRuntimeEnv } = require("./env");

validateRuntimeEnv();
const trim = (value) => String(value || "").trim();

module.exports = {
  port: Number(trim(process.env.PORT)),
  sessionSecret: trim(process.env.SESSION_SECRET),
  jwtSecret: trim(process.env.JWT_SECRET),
  adminPassword: trim(process.env.ADMIN_PASSWORD),
  auth: {
    adminCookieName: "admin_token"
  },
  supabase: {
    url: trim(process.env.SUPABASE_URL),
    secretKey: trim(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    buckets: {
      products: trim(process.env.SUPABASE_PRODUCTS_BUCKET),
      payments: trim(process.env.SUPABASE_PAYMENTS_BUCKET)
    }
  }
};
