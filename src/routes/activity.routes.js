import express from 'express';
import { requireAdmin } from '../middlewares/session.middleware.js';
import { getComponentActivityHistory } from '../controllers/activity.controller.js';

const router = express.Router();

router.get('/components/history', requireAdmin, getComponentActivityHistory);

export default router;
