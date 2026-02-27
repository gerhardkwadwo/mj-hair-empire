const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const appConfig = require("../config/app");

let supabaseClient = null;
let loggedSupabaseInit = false;

function safeTrim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = safeTrim(appConfig.supabase.url);
  const secretKey = safeTrim(appConfig.supabase.secretKey);

  if (!supabaseUrl || !secretKey) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.");
  }

  const isNewSecretKey = secretKey.startsWith("sb_secret_");
  const fetchWithoutBearer = async (input, init = {}) => {
    if (!isNewSecretKey) return fetch(input, init);
    const headers = new Headers(init.headers || {});
    headers.delete("Authorization");
    headers.set("apikey", secretKey);
    return fetch(input, { ...init, headers });
  };

  if (!loggedSupabaseInit) {
    const prefix = secretKey.slice(0, 3);
    const dotCount = (secretKey.match(/\./g) || []).length;
    const keyLength = secretKey.length;
    console.log(
      `[Supabase Storage] init url=${supabaseUrl} keyPrefix=${prefix} dotCount=${dotCount} keyLength=${keyLength}`
    );
    loggedSupabaseInit = true;
  }

  supabaseClient = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      headers: isNewSecretKey
        ? { apikey: secretKey }
        : { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
      fetch: fetchWithoutBearer
    }
  });
  return supabaseClient;
}

function buildObjectPath(file, folder = "misc") {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const safeFolder = String(folder || "misc").replace(/[^a-zA-Z0-9/_-]/g, "");
  const random = crypto.randomBytes(6).toString("hex");
  return `${safeFolder}/${Date.now()}-${random}${ext}`;
}

async function uploadBufferToBucket({ bucket, file, folder }) {
  if (!file || !file.buffer) throw new Error("Missing upload file buffer.");

  const client = getSupabaseClient();
  const objectPath = buildObjectPath(file, folder);
  const contentType = file.mimetype || "application/octet-stream";
  const fileMeta = {
    fileName: file.originalname || "unknown",
    mimeType: contentType,
    size: Number(file.size || 0),
    bucket,
    objectPath
  };

  const { error: uploadError } = await client.storage
    .from(bucket)
    .upload(objectPath, file.buffer, { contentType, upsert: false });

  if (uploadError) {
    console.error("[Supabase Storage] upload failed", {
      ...fileMeta,
      statusCode: uploadError.statusCode || uploadError.status || null,
      errorMessage: uploadError.message || "Unknown upload error"
    });
    throw new Error(`Supabase upload failed: ${uploadError.message}`);
  }

  console.log("[Supabase Storage] upload success", fileMeta);
  const { data } = client.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

module.exports = {
  uploadBufferToBucket
};
