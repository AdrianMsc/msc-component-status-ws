import crypto from 'crypto';
import * as SessionModel from '../models/session.model.js';

const getCookieName = () => process.env.SESSION_COOKIE_NAME || 'sid';

const getSessionTtlMs = () => {
	const daysRaw = process.env.SESSION_TTL_DAYS;
	const days = daysRaw ? Number(daysRaw) : 7;
	if (!Number.isFinite(days) || days <= 0) return 7 * 24 * 60 * 60 * 1000;
	return days * 24 * 60 * 60 * 1000;
};

export const getSessionCookieName = () => getCookieName();

export const createSessionForUser = async ({ userId, ip, userAgent, data }) => {
	const sessionId = crypto.randomUUID();
	const expiresAt = new Date(Date.now() + getSessionTtlMs());

	const session = await SessionModel.createSession({
		sessionId,
		userId,
		expiresAt,
		ip,
		userAgent,
		data
	});

	return { sessionId: session.session_id, expiresAt: session.expires_at };
};

export const getValidSession = async (sessionId) => {
	return await SessionModel.findValidBySessionId(sessionId);
};

export const touchSession = async (sessionId) => {
	await SessionModel.touch(sessionId);
};

export const revokeSession = async (sessionId) => {
	return await SessionModel.revoke(sessionId);
};

export const cleanupExpiredSessions = async () => {
	try {
		await SessionModel.cleanupExpired();
	} catch (err) {
		console.error('Session cleanup failed:', err);
	}
};
