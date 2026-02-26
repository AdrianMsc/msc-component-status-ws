import express from 'express';
import {
	startLogin,
	handleLoginCallback,
	loginFrontendTokenExchange,
	logout,
	me
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/session.middleware.js';

const router = express.Router();

router.get('/auth/login', startLogin);
router.get('/auth/callback', handleLoginCallback);
router.post('/auth/login-frontend', loginFrontendTokenExchange);
router.post('/auth/logout', logout);
router.get('/auth/me', requireAuth, me);

export default router;
