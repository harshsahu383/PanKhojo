import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { authenticateAdmin } from "./middleware/auth.middleware.js";
import requestRoutes from "./routes/request.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import trackingRoutes from "./routes/tracking.routes.js";

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT || 4000);
const isProduction = process.env.NODE_ENV === "production";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters.");
}
if (isProduction && !/^[a-f0-9]{64}$/i.test(process.env.AADHAAR_ENCRYPTION_KEY || "")) {
  throw new Error("Production requires a 32-byte hexadecimal AADHAAR_ENCRYPTION_KEY.");
}

// Trust only the explicitly configured reverse-proxy hop count. Do not blindly trust all proxies.
if (process.env.TRUST_PROXY_HOPS) {
  const hops = Number(process.env.TRUST_PROXY_HOPS);
  if (!Number.isInteger(hops) || hops < 1 || hops > 3) throw new Error("TRUST_PROXY_HOPS must be an integer from 1 to 3.");
  app.set("trust proxy", hops);
}

app.disable("x-powered-by");
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: isProduction ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: isProduction ? { maxAge: 15552000, includeSubDomains: true, preload: false } : false,
  referrerPolicy: { policy: "no-referrer" },
}));

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || process.env.FRONTEND_URL || "http://localhost:5173")
  .split(",").map((value) => value.trim()).filter(Boolean);
if (isProduction && allowedOrigins.some((origin) => origin === "*" || origin.includes("localhost"))) {
  throw new Error("Production CORS_ALLOWED_ORIGINS must contain only exact HTTPS website origins.");
}
app.use(cors({
  origin(origin, callback) {
    // Non-browser clients may omit Origin; browser origins must match the explicit allowlist.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS."));
  },
  methods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  maxAge: 600,
}));
app.use(express.json({ limit: "12kb", strict: true }));
app.use(express.urlencoded({ extended: false, limit: "12kb", parameterLimit: 30 }));

// Sensitive API responses must not be cached by browsers or shared proxies.
app.use("/api", (_req, res, next) => {
  res.set({ "Cache-Control": "no-store, no-cache, must-revalidate, private", Pragma: "no-cache", Expires: "0" });
  next();
});
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 240,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please wait and try again." },
});
app.use("/api", apiLimiter);

app.get("/", (_req, res) => res.json({ success: true, message: "Welcome to PANKhojo API", version: "1.0.0" }));
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/tracking", trackingRoutes);
app.get("/api/admin/profile", authenticateAdmin, (req, res) => res.json({ success: true, message: "Administrator authentication successful.", admin: req.admin }));
app.use((_req, res) => res.status(404).json({ success: false, message: "API endpoint not found." }));
app.use((error, _req, res, _next) => {
  if (error.message === "Origin is not allowed by CORS.") return res.status(403).json({ success: false, message: "Request origin is not allowed." });
  if (error.type === "entity.too.large") return res.status(413).json({ success: false, message: "Request payload is too large." });
  console.error("Server error:", error.message);
  return res.status(500).json({ success: false, message: "Internal server error." });
});

app.listen(PORT, () => {
  console.log("PANKhojo Backend Started");
  console.log(`Listening on configured port ${PORT}`);
});
