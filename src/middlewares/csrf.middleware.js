import crypto from 'crypto';

export const csrfTokenMiddleware = (req, res, next) => {
	if (!req.cookies['csrf-token']) {
		const token = crypto.randomBytes(32).toString('hex');
		res.cookie('csrf-token', token, {
			httpOnly: false, // Frontend needs to read this
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.SESSION_COOKIE_SAMESITE || 'lax',
			path: '/'
		});
	}
	next();
};

export const requireCsrfToken = (req, res, next) => {
	// Safe methods
	if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
		return next();
	}

	const cookieToken = req.cookies['csrf-token'];
	const headerToken = req.headers['x-csrf-token'];

	if (!cookieToken || !headerToken || cookieToken !== headerToken) {
		return res.status(403).json({ error: 'Invalid or missing CSRF token' });
	}

	next();
};
