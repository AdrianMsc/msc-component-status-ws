# Frontend Implementation Guidelines: React Auth0 + Backend Session

Based on the architecture changes to support **Frontend OAuth (Auth0)**, here is the comprehensive guide for implementing the authentication flow using **React, Vite, TypeScript, and `@auth0/auth0-react`**.

## 1. Architecture Overview
- **Authentication Pattern**: Client-Side OAuth via Auth0 SDK **mixed** with Server-Side Sessions.
- **Why this approach?**: Auth0 handles the login UI and OAuth handshake natively on the frontend. The backend requires a secure session cookie (`sid`) for its internal API routes.
- **The Bridge (Token Exchange)**: Once Auth0 gives the frontend an Access Token, the frontendPOSTs it to a backend exchange endpoint (`/auth/login-frontend`). The backend verifies the token and sets the `sid` cookie.
- **State Management**: The frontend handles its authenticated state using React Context, relying on Auth0 for the login trigger, but the backend session for actual data fetching.

## 2. API Configuration (Axios/Fetch)
All requests to the backend API **must** include credentials for the session cookie to be attached automatically.

**Environment Variables (Vite):**
Create a `.env` file in your Vite project:
```env
VITE_API_URL=http://localhost:4242
VITE_AUTH0_DOMAIN=your-tenant.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-audience
```

**Using Axios:**
```typescript
// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // Required for cookies to be sent
});
```

## 3. Core Authentication Flows

### A. Setup Auth0 Provider
Wrap your application in the `Auth0Provider`.

```tsx
// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Auth0Provider } from '@auth0/auth0-react';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      }}
    >
      <App />
    </Auth0Provider>
  </React.StrictMode>
);
```

### B. Custom AuthContext & Token Exchange
We must capture the Auth0 token and exchange it with the backend.

**Action:** Create an `AuthContext` that combines the Auth0 state with our backend session validation.

```tsx
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { api } from '../lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  role: string;
  provider: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { 
    isAuthenticated: isAuth0Authenticated, 
    isLoading: isAuth0Loading, 
    getAccessTokenSilently,
    loginWithRedirect,
    logout: auth0Logout 
  } = useAuth0();
  
  const [user, setUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const establishSession = async () => {
      // If Auth0 is still loading, wait.
      if (isAuth0Loading) return;

      // If Auth0 says we are not logged in, ensure we clear local state
      if (!isAuth0Authenticated) {
        if (isMounted) {
          setUser(null);
          setIsSessionLoading(false);
        }
        return;
      }

      try {
        // 1. Get token from Auth0
        const token = await getAccessTokenSilently();

        // 2. Exchange token for backend session cookie
        await api.post(
            '/auth/login-frontend', 
            {}, // body
            { headers: { Authorization: `Bearer ${token}` } } // auth header
        );

        // 3. Cookie is set. Now fetch the actual user profile from the backend
        const meResponse = await api.get('/auth/me');
        if (meResponse.data.authenticated && isMounted) {
          setUser(meResponse.data.user);
        }
      } catch (error) {
        console.error("Failed to establish session:", error);
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsSessionLoading(false);
      }
    };

    establishSession();

    return () => {
      isMounted = false;
    };
  }, [isAuth0Authenticated, isAuth0Loading, getAccessTokenSilently]);

  const handleLogin = () => loginWithRedirect();
  
  const handleLogout = async () => {
    // 1. Destroy backend session cookie
    try {
        await api.post('/auth/logout');
    } catch (e) {
        console.warn("Backend logout failed", e);
    }
    // 2. Clear Auth0 state
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const isLoading = isAuth0Loading || isSessionLoading;

  return (
    <AuthContext.Provider value={{ user, isLoading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### C. Using the Hook in Components
In your React components, exclusively use your custom `useAuth()` hook, **not** `useAuth0()`.

```tsx
// src/components/LoginButton.tsx
import { useAuth } from '../contexts/AuthContext';

export const Header = () => {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return user ? (
    <div>
      Welcome, {user.name}!
      <button onClick={logout}>Log Out</button>
    </div>
  ) : (
    <button onClick={login}>Log In</button>
  );
};
```

## 4. Security Requirements: CSRF Protection
The backend implementation uses `csrfTokenMiddleware` (imported in `index.js`).

**Action:** The frontend must acquire and attach a CSRF token for any mutating requests (POST, PUT, DELETE, PATCH).

**Example using Axios interceptor:**
```typescript
// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

let csrfToken: string | null = null;

export const fetchCsrfToken = async () => {
   const res = await api.get('/csrf-token'); // Check backend for exact route
   csrfToken = res.data.csrfToken;
};

// Add interceptor for everything EXCEPT GET methods
api.interceptors.request.use((config) => {
  if (config.method !== 'get' && csrfToken) {
    config.headers['X-CSRF-Token'] = csrfToken; 
  }
  return config;
});
```

## 5. UI/UX Considerations
- **Handling Loading States**: The `AuthContext` seamlessly merges Auth0's loading state and the backend validation loading state into a single `isLoading` boolean. Show a spinner while this is true.
- **Session Expiration**: Catch `401 Unauthorized` API errors globally to reset the auth state if a session expires while the application is open.

```tsx
// Example global interceptor in src/lib/api.ts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optionally trigger a logout if a backend session expires
    if (error.response?.status === 401 && error.config.url !== '/auth/login-frontend') {
      console.warn('Session expired or unauthorized');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);
```
