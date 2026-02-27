require("dotenv").config();
module.exports = {
  brandName: process.env.BRAND_NAME || "MJ Hair Empire",
  tagline: process.env.TAGLINE || "Luxury Wigs. Effortless Beauty.",
  primaryColor: "#1F1F1F",
  accentColor: "#C8A24D",
  headingFont: "'Cormorant Garamond', Georgia, serif",
  bodyFont: "'Inter', 'Segoe UI', sans-serif",
  momoNumber: process.env.MOMO_NUMBER || "05XXXXXXXX",
  momoAccountName: process.env.MOMO_ACCOUNT_NAME || process.env.BRAND_NAME || "MJ Hair Empire",
  whatsappNumber: process.env.WHATSAPP_NUMBER || "2335XXXXXXXX",
  location: process.env.LOCATION || "Accra, Ghana",
  deliveryInfo: process.env.DELIVERY_INFO || "Delivery within 1–3 working days.",
  instagramUrl:
    process.env.INSTAGRAM_URL ||
    process.env.INSTAGRAM ||
    "https://instagram.com/mjhairempire",
  tiktokUrl:
    process.env.TIKTOK_URL ||
    process.env.TIKTOK ||
    "https://tiktok.com/@mjhairempire",
  email: process.env.CONTACT_EMAIL || "info@mjhairempire.com",
  currency: "GHS",
  currencyLocale: "en-GH",
  businessLocation: process.env.LOCATION || "Accra, Ghana",
  instagram:
    process.env.INSTAGRAM_URL ||
    process.env.INSTAGRAM ||
    "https://instagram.com/mjhairempire",
  tiktok:
    process.env.TIKTOK_URL ||
    process.env.TIKTOK ||
    "https://tiktok.com/@mjhairempire"
};
