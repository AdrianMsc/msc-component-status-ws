import { generators } from 'openid-client';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import * as OidcService from '../services/oidc.service.js';
import * as UserModel from '../models/user.model.js';
import * as SessionService from '../services/session.service.js';

const getCookieOptions = () => {
	const isProd = process.env.NODE_ENV === 'production';
	const sameSite = process.env.SESSION_COOKIE_SAMESITE || 'lax';
	return {
		httpOnly: true,
		secure: isProd,
		sameSite,
		path: '/'
	};
};

const getAuthTempCookieOptions = () => {
	const base = getCookieOptions();
	return { ...base, maxAge: 10 * 60 * 1000 };
};

const getRedirectAfterLogin = () => process.env.AUTH_REDIRECT_AFTER_LOGIN || '/';
const getRedirectAfterLogout = () => process.env.AUTH_REDIRECT_AFTER_LOGOUT || '/';

export const startLogin = async (req, res) => {
	const state = generators.state();
	const { authorizationUrl, codeVerifier } = await OidcService.buildAuthorization({
		state
	});

	res.cookie('oidc_state', state, getAuthTempCookieOptions());
	res.cookie('oidc_code_verifier', codeVerifier, getAuthTempCookieOptions());

	return res.redirect(authorizationUrl);
};

export const handleLoginCallback = async (req, res) => {
	try {
		const stateCookie = req.cookies?.oidc_state;
		const codeVerifier = req.cookies?.oidc_code_verifier;

		if (!stateCookie || !codeVerifier) {
			return res.status(400).json({ error: 'Missing OIDC state' });
		}

		const { claims, userInfo } = await OidcService.handleCallback({
			params: req.query,
			state: stateCookie,
			codeVerifier
		});

		const provider = OidcService.getOidcProviderName();
		const providerSubject = claims?.sub;
		if (!providerSubject) {
			return res.status(400).json({ error: 'Missing subject claim' });
		}

		const email = userInfo?.email ?? claims?.email ?? null;
		const name = userInfo?.name ?? claims?.name ?? null;
		const picture = userInfo?.picture ?? claims?.picture ?? null;

		const user = await UserModel.upsertFromOidcProfile({
			provider,
			providerSubject,
			email,
			name,
			picture
		});

		const { sessionId, expiresAt } = await SessionService.createSessionForUser({
			userId: user.id,
			ip: req.ip,
			userAgent: req.headers['user-agent'],
			data: { provider }
		});

		const cookieName = SessionService.getSessionCookieName();

		res.clearCookie('oidc_state', { path: '/' });
		res.clearCookie('oidc_code_verifier', { path: '/' });

		res.cookie(cookieName, sessionId, {
			...getCookieOptions(),
			expires: new Date(expiresAt)
		});

		return res.redirect(getRedirectAfterLogin());
	} catch (error) {
		console.error('Auth Callback Error:', error);
		return res.status(500).json({ error: 'Internal Authentication Error' });
	}
};

const client = jwksClient({
	jwksUri: `${process.env.OIDC_ISSUER}/.well-known/jwks.json`
});

function getKey(header, callback) {
	client.getSigningKey(header.kid, function (err, key) {
		if (err) return callback(err);
		const signingKey = key.getPublicKey();
		callback(null, signingKey);
	});
}

export const loginFrontendTokenExchange = async (req, res) => {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({ error: 'Missing or invalid Authorization header' });
		}
		const token = authHeader.split(' ')[1];

		// Verify the token
		jwt.verify(
			token,
			getKey,
			{
				algorithms: ['RS256'],
				issuer: `${process.env.OIDC_ISSUER}/`,
				audience: process.env.OIDC_AUDIENCE
			},
			async (err, decoded) => {
				if (err) {
					console.error('JWT Verification Error:', err);
					return res.status(401).json({ error: 'Invalid token' });
				}

				try {
					const provider = OidcService.getOidcProviderName() || 'auth0';
					const providerSubject = decoded.sub;

					// Fetch profile from IDP or Request Body
					// We prefer data from request body if available, otherwise fallback to token claims
					const email = req.body.email || decoded.email || null;
					const name = req.body.name || decoded.name || decoded.nickname || null;
					const picture = req.body.picture || decoded.picture || null;
					const role = req.body.role || decoded['https://msc-component-status-api/roles']?.[0] || 'user';

					const user = await UserModel.upsertFromOidcProfile({
						provider,
						providerSubject,
						email,
						name,
						picture,
						role
					});

					const { sessionId, expiresAt } = await SessionService.createSessionForUser({
						userId: user.id,
						ip: req.ip,
						userAgent: req.headers['user-agent'],
						data: { provider }
					});

					const cookieName = SessionService.getSessionCookieName();

					res.cookie(cookieName, sessionId, {
						...getCookieOptions(),
						expires: new Date(expiresAt)
					});

					return res.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
				} catch (innerError) {
					console.error('Error during token exchange processing:', innerError);
					return res.status(500).json({ error: 'Internal Server Error during token exchange processing' });
				}
			}
		);
	} catch (error) {
		console.error('Frontend Login Error:', error);
		return res.status(500).json({ error: 'Internal Server Error during login' });
	}
};

export const logout = async (req, res) => {
	const cookieName = SessionService.getSessionCookieName();
	const sid = req.cookies?.[cookieName];

	if (sid) {
		await SessionService.revokeSession(sid);
	}

	res.clearCookie(cookieName, { path: '/' });

	const endSessionUrl = process.env.OIDC_END_SESSION_URL;
	if (endSessionUrl) {
		const postLogoutRedirectUri = process.env.OIDC_POST_LOGOUT_REDIRECT_URI;
		if (postLogoutRedirectUri) {
			const url = new URL(endSessionUrl);
			url.searchParams.set('post_logout_redirect_uri', postLogoutRedirectUri);
			return res.redirect(url.toString());
		}
		return res.redirect(endSessionUrl);
	}

	return res.redirect(getRedirectAfterLogout());
};

export const me = async (req, res) => {
	if (!req.user) return res.status(401).json({ authenticated: false });

	return res.json({
		authenticated: true,
		user: {
			id: req.user.id,
			email: req.user.email,
			name: req.user.name,
			picture: req.user.picture,
			role: req.user.role,
			provider: req.user.provider
		}
	});
};
