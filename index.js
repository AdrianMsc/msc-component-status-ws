import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import limiter from "./src/middlewares/rateLimiter.js";
import componentRoutes from "./src/routes/component.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4242;

// Middlewares
app.use(express.json());
app.use(cors());
app.use(limiter);

// Routes
app.use("/", componentRoutes);

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
