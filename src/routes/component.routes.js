import express from "express";
import upload from "../middlewares/multer.js";
import {
  handshake,
  getAllComponentNames,
  getComponentCount,
  getAllComponents,
  createComponent,
  updateComponent,
  deleteComponent,
  updateComponentResources,
  uploadImage,
} from "../controllers/component.controller.js";

const router = express.Router();

router.get("/handshake", handshake);
router.get("/allcomponents", getAllComponentNames);
router.get("/count", getComponentCount);
router.get("/components", getAllComponents);
router.post("/uploads/images", upload.single("image"), uploadImage);
router.post(
  "/categories/:category/components",
  upload.single("image"),
  createComponent,
);
router.put("/components/resources/:id", updateComponentResources);
router.put(
  "/categories/:category/components/:id",
  upload.single("image"),
  updateComponent,
);
router.delete("/components/:id", deleteComponent);

export default router;
