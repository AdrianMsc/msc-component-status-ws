import express from "express";
import {
  handshake,
  getAllComponentNames,
  getComponentCount,
  getAllComponents,
  createComponent,
  updateComponent,
  deleteComponent,
  updateComponentResources,
} from "../controllers/component.controller.js";

const router = express.Router();

router.get("/handshake", handshake);
router.get("/allcomponents", getAllComponentNames);
router.get("/count", getComponentCount);
router.get("/components", getAllComponents);
router.post("/categories/:category/components", createComponent);
router.put("/components/resources/:id", updateComponentResources);
router.put("/categories/:category/components/:id", updateComponent);
router.delete("/components/:id", deleteComponent);

export default router;
