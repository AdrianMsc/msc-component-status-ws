// src/middlewares/activityLogger.js

/**
 * Middleware to log user activity, specifically for mutations (POST, PUT, DELETE).
 * Requires sessionMiddleware to run before it so that `req.user` is populated.
 */
export const activityLogger = (req, res, next) => {
	// Only log mutations, not simple GET requests
	if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
		const timestamp = new Date().toLocaleTimeString();

		// Extract user info if available from the session
		const userEmail = req.user?.email || 'Anonymous';
		const userRole = req.user?.role || 'user';

		// ANSI Color Codes
		const reset = '\x1b[0m';
		const cyan = '\x1b[36m';
		const magenta = '\x1b[35m';
		const green = '\x1b[32m';
		const yellow = '\x1b[33m';
		const red = '\x1b[31m';
		const bold = '\x1b[1m';

		// Determine color based on method
		let methodColor = green;
		if (req.method === 'PUT' || req.method === 'PATCH') methodColor = yellow;
		if (req.method === 'DELETE') methodColor = red;

		// Formatted Log output
		console.log(
			`\n${cyan}[ACTIVITY]${reset} ${magenta}${timestamp}${reset} ` +
				`| ${bold}${userEmail}${reset} (${userRole}) ` +
				`-> ${methodColor}${req.method}${reset} ${req.originalUrl}\n`
		);
	}

	next();
};

export default activityLogger;
