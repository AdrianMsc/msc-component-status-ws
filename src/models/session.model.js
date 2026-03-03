import sql from '../config/db.js';

export const createSession = async ({ sessionId, userId, expiresAt, ip, userAgent, data }) => {
	const rows = await sql(
		`INSERT INTO sessions (session_id, user_id, expires_at, ip, user_agent, data)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
		[sessionId, userId, expiresAt, ip ?? null, userAgent ?? null, data ?? null]
	);

	return rows[0];
};

export const findValidBySessionId = async (sessionId) => {
	const rows = await sql(
		`SELECT * FROM sessions
     WHERE session_id = $1
       AND revoked_at IS NULL
       AND expires_at > now()
     LIMIT 1`,
		[sessionId]
	);

	return rows[0];
};

export const touch = async (sessionId) => {
	await sql(`UPDATE sessions SET last_seen_at = now() WHERE session_id = $1`, [sessionId]);
};

export const revoke = async (sessionId) => {
	const rows = await sql(`UPDATE sessions SET revoked_at = now() WHERE session_id = $1 RETURNING *`, [sessionId]);
	return rows[0];
};

export const cleanupExpired = async () => {
	await sql(`DELETE FROM sessions WHERE expires_at < now()`);
};
