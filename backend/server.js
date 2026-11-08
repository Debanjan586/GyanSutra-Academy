/* ============================================================
   GyanSutra Academy — Express API entry point
   ============================================================ */

import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import { connectDB } from "./config/db.js";
import { authRouter } from "./routes/auth.js";
import { publicCoursesRouter } from "./routes/courses.js";
import { adminRouter } from "./routes/admin.js";
import { uploadRouter } from "./routes/upload.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/* ---------- Trust proxy (required on Render) ---------- */
app.set("trust proxy", 1);

/* ---------- Security headers ---------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'"],
      },
    },
  }),
);

/* ---------- CORS ---------- */
const allowedOrigin = process.env.FRONTEND_ORIGIN;
if (!allowedOrigin) {
  console.warn(
    "[WARN] FRONTEND_ORIGIN is not set — CORS will block all browser requests.",
  );
}
app.use(
  cors({
    origin: allowedOrigin || false,
    credentials: true, // allow cookies cross-origin
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  }),
);

/* ---------- Body parser ---------- */
app.use(express.json({ limit: "256kb" }));

/* ---------- Session ---------- */
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
      ttl: 60 * 60 * 8, // 8 hours
      autoRemove: "native",
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 1000 * 60 * 60 * 8, // 8 hours
    },
    name: "gs.sid",
  }),
);

/* ---------- Static frontend files ---------- */
app.use(express.static(join(__dirname, "../")));

/* ---------- Routes ---------- */
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/courses", publicCoursesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/upload", uploadRouter);

/* ---------- 404 ---------- */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

/* ---------- Central error handler ---------- */
app.use(errorHandler);

/* ---------- Start ---------- */
connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(
      `[server] Listening on port ${PORT} (${process.env.NODE_ENV || "development"})`,
    ),
  );
});
