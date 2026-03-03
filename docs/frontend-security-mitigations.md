# Frontend Security & Mitigation Guidelines

This document outlines the security mitigations that **must be implemented** on the frontend (React/Vite) to secure the Auth0 + Backend Session architecture.

## 1. Prevent Cross-Site Scripting (XSS)

XSS is the most critical vulnerability for this architecture because the frontend temporarily handles the raw Auth0 Access Token. If an attacker can execute malicious JavaScript, they could intercept the token during the exchange phase.

**Mitigation Steps:**
- **Avoid `dangerouslySetInnerHTML`**: Never render raw HTML strings provided by users. React protects against XSS by default when you use standard JSX mapping (`{userData}`), but using `dangerouslySetInnerHTML` bypasses this.
- **Sanitize Markdown/HTML**: If your application *must* render Markdown or HTML (e.g., from a rich-text editor), use a strict sanitizer like `DOMPurify` before rendering it.
- **Content Security Policy (CSP)**: Configure the backend (via Helmet) or explicitly set meta tags in the frontend `index.html` to establish a strict CSP. This prevents unauthorized scripts from executing or sending data to untrusted domains.

```html
<!-- Example restrictive CSP in index.html -->
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'https://your-tenant.auth0.com'; connect-src 'self' http://localhost:4242 https://your-tenant.auth0.com;">
```

## 2. Enforce CSRF Protections

The backend utilizes `sid` HTTP-only cookies, making it susceptible to Cross-Site Request Forgery (CSRF). 

**Mitigation Steps:**
- **Always Attach the CSRF Token**: As documented in the main integration guidelines, ensure the central Axios instance (`src/lib/api.ts`) intercepts all mutating requests (POST, PUT, DELETE, PATCH) and appends the `X-CSRF-Token` header.
- **Validate CORS Settings**: The backend's CORS configuration should only allow the exact frontend domains (e.g., `http://localhost:5173`, `https://your-production.com`). Do not use broad wildcards (`*`) for CORS `origin`.

## 3. Prevent Token Replay Attacks

If an attacker tricks a user into logging into a rogue app on the same Auth0 tenant, they could steal an Auth0 token and submit it to your backend (`/auth/login-frontend`). 

**Mitigation Steps:**
- **Backend Enforces Audience**: The backend `auth.controller.js` has been updated to strictly verify the `audience` claim (`process.env.OIDC_AUDIENCE`). 
- **Frontend Provides Correct Audience**: Ensure your Vite environment variable `VITE_AUTH0_AUDIENCE` matches the backend's `OIDC_AUDIENCE` exactly so the minted token is valid for this specific API.

```env
# .env (Frontend)
VITE_AUTH0_AUDIENCE=your-api-audience

# .env (Backend)
OIDC_AUDIENCE=your-api-audience
```

## 4. Ensure Complete Session Termination

A desynchronization between the Auth0 session and the backend session can lead to state fixation.

**Mitigation Steps:**
- **Atomic Logout**: Your logout handler MUST explicitly destroy the backend session first, then clear the Auth0 session.

```javascript
  const handleLogout = async () => {
    // 1. Destroy backend session cookie (vital)
    try {
        await api.post('/auth/logout');
    } catch (e) {
        console.warn("Backend logout failed", e);
    }
    // 2. Clear Auth0 state (vital)
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };
```
- **Global 401 Interceptor**: If the backend session expires independently (due to inactivity or administrative revocation), the frontend must globally catch the `401 Unauthorized` response and trigger a complete logout to clear the local DOM state.
