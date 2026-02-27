const jwt = require("jsonwebtoken");
const appConfig = require("../config/app");

function readAdminToken(req) {
  return req.cookies?.[appConfig.auth.adminCookieName] || "";
}

function verifyAdminToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, appConfig.jwtSecret);
  } catch (_error) {
    return null;
  }
}

function attachAdminAuth(req, _res, next) {
  const token = readAdminToken(req);
  const payload = verifyAdminToken(token);
  req.adminAuth = payload || null;
  req.isAdminAuthenticated = Boolean(payload?.isAdmin);
  next();
}

function requireAdmin(req, res, next) {
  if (req.isAdminAuthenticated) return next();
  return res.redirect("/admin/login");
}

module.exports = {
  attachAdminAuth,
  requireAdmin,
  readAdminToken,
  verifyAdminToken
};
