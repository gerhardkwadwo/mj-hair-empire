require("dotenv").config();

const REQUIRED_RUNTIME_ENVS = [
  "PORT",
  "ADMIN_PASSWORD",
  "SESSION_SECRET",
  "JWT_SECRET",
  "SUPABASE_URL",
  "SUPABASE_PRODUCTS_BUCKET",
  "SUPABASE_PAYMENTS_BUCKET",
  "DATABASE_URL",
  "DIRECT_URL"
];

function validateRuntimeEnv() {
  const missing = REQUIRED_RUNTIME_ENVS.filter((key) => !process.env[key] || String(process.env[key]).trim() === "");
  const hasSupabaseSecret =
    (process.env.SUPABASE_SECRET_KEY && String(process.env.SUPABASE_SECRET_KEY).trim() !== "") ||
    (process.env.SUPABASE_SERVICE_ROLE_KEY && String(process.env.SUPABASE_SERVICE_ROLE_KEY).trim() !== "");
  if (!hasSupabaseSecret) missing.push("SUPABASE_SECRET_KEY");
  if (!missing.length) return;

  throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
}

module.exports = {
  REQUIRED_RUNTIME_ENVS,
  validateRuntimeEnv
};
