import express from "express";
import {
  getIndexPage,
  getLabPage,
} from "../controllers/staticHtml.controller.js";

const router = express.Router();

router.get("/", getIndexPage);

// Lab pages (HTML only)
// Add more routes like this:
// router.get("/lab/my-experiment", getLabPage("my-experiment/index.html"));
router.get("/lab/pdp-v2", getLabPage("pdp-v2/pdp.html"));
router.get("/lab/homepage-v2", getLabPage("homepage-v2/homepage-v2.html"));

export default router;
