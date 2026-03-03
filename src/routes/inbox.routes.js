import express from 'express';
import { requireAuth } from '../middlewares/session.middleware.js';
import { deleteInboxMessage, getInboxMessages, newInboxMessage } from '../controllers/inbox.controller.js';

const router = express.Router();

router.get('/inbox', getInboxMessages);
router.post('/message', newInboxMessage);
router.delete('/message/:id', requireAuth, deleteInboxMessage);

export default router;
