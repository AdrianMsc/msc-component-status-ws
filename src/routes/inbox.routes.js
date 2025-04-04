import express from "express";
import {
  deleteInboxMessage,
  getInboxMessages,
  newInboxMessage,
} from "../controllers/inbox.controller.js";

const router = express.Router();

router.get("/inbox", getInboxMessages);
router.post("/message", newInboxMessage);
router.delete("/message/:id", deleteInboxMessage);

export default router;
