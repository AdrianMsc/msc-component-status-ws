import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import limiter from './src/middlewares/rateLimiter.js';
import componentRoutes from './src/routes/component.routes.js';
import inboxRoutes from './src/routes/inbox.routes.js';
import staticHtmlRoutes from './src/routes/staticHtml.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import { sessionMiddleware } from './src/middlewares/session.middleware.js';
import { csrfTokenMiddleware } from './src/middlewares/csrf.middleware.js';
import { activityLogger } from './src/middlewares/activityLogger.js';
import * as SessionService from './src/services/session.service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4242;

app.set('trust proxy', 1);

app.locals.publicDir = path.join(__dirname, 'public');

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
	.split(',')
	.map((s) => s.trim())
	.filter(Boolean);

const corsOptions = {
	origin:
		allowedOrigins.length > 0
			? (origin, cb) => {
					if (!origin) return cb(null, true);
					if (allowedOrigins.includes(origin)) return cb(null, true);
					return cb(new Error('Not allowed by CORS'));
				}
			: true,
	credentials: process.env.CORS_ALLOW_CREDENTIALS === 'true'
};

// Custom Morgan Tokens for User Info
morgan.token('user-email', (req) => {
	return req.user?.email || 'Anonymous';
});
morgan.token('user-role', (req) => {
	return req.user?.role || 'user';
});

// Middlewares
app.use(helmet());
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(csrfTokenMiddleware);
app.use(activityLogger); // Apply the custom activity logger
app.use(limiter);

// Enhanced Morgan format
const morganFormat =
	':remote-addr - :user-email (:user-role) [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms';
app.use(
	morgan(morganFormat, {
		skip: (req, res) => req.method === 'GET'
	})
);

app.get('/favicon.ico', (_, res) => res.status(204).end());

app.use(express.static(app.locals.publicDir));

// Routes
app.use('/', staticHtmlRoutes);
app.use('/', authRoutes);
app.use('/', componentRoutes);
app.use('/', inboxRoutes);

app.use((req, res) => {
	const acceptsHtml = (req.headers.accept ?? '').includes('text/html');
	if (acceptsHtml) {
		res.setHeader('content-type', 'text/html; charset=utf-8');
		return res
			.status(404)
			.send(
				`<!doctype html><html><head><meta charset="utf-8" /><title>404</title></head><body><h1>404 - Not Found</h1><p>Route <code>${req.path}</code> does not exist.</p></body></html>`
			);
	}
	return res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, () => {
	console.log(`Listening on http://localhost:${PORT}`);
	setInterval(SessionService.cleanupExpiredSessions, 24 * 60 * 60 * 1000);
});
