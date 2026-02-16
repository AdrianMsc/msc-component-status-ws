import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import limiter from "./src/middlewares/rateLimiter.js";
import componentRoutes from "./src/routes/component.routes.js";
import inboxRoutes from "./src/routes/inbox.routes.js";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4242;

// Middlewares
app.use(express.json());
app.use(cors());
app.use(limiter);
app.use(morgan("dev"));

app.get("/favicon.ico", (_, res) => res.status(204).end());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Routes
app.use("/", componentRoutes);
app.use("/", inboxRoutes);

app.use((req, res) => {
  const acceptsHtml = (req.headers.accept ?? "").includes("text/html");
  if (acceptsHtml) {
    res.setHeader("content-type", "text/html; charset=utf-8");
    return res
      .status(404)
      .send(
        `<!doctype html><html><head><meta charset="utf-8" /><title>404</title></head><body><h1>404 - Not Found</h1><p>Route <code>${req.path}</code> does not exist.</p></body></html>`,
      );
  }
  return res.status(404).json({ error: "Not Found", path: req.path });
});

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
