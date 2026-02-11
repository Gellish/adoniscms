
// State using Svelte 5 Runes
import { ClientDB } from './db.js';

interface User {
    id: number;
    email: string;
    fullName: string;
    role?: string;
}

let user = $state<User | null>(null);
let initialized = $state(false);

// Initial Hydration (Synchronous)
if (typeof localStorage !== 'undefined') {
    const cached = localStorage.getItem('auth_session');
    if (cached) {
        user = JSON.parse(cached);
        initialized = true;
    }
}

export function useAuth() {

    async function checkAuth() {
        // 1. Try Offline Session first (Fast & Works Offline)
        try {
            const cachedUser = await ClientDB.getSession();
            if (cachedUser) {
                user = cachedUser;
                localStorage.setItem('auth_session', JSON.stringify(user));
            }
        } catch (e) {
            console.warn('[Auth] Error reading offline session:', e);
        } finally {
            initialized = true;
        }

        // 2. Try Online verification (Background)
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            console.log('[Auth] Offline: Skipping server verification');
            return;
        }

        try {
            // Need options credentials: 'include' for cookies
            const res = await fetch('http://localhost:3333/api/auth/me', {
                credentials: 'include'
            });
            if (res.ok) {
                const freshUser = await res.json();
                user = freshUser;
                // Update offline cache
                await ClientDB.setSession(freshUser);
            } else {
                // Only clear if explicitly unauthorized? 
                // Careful: if server is unreachable, we don't want to clear.
                // If 401, clear.
                if (res.status === 401) {
                    user = null;
                    await ClientDB.clearSession();
                }
            }
        } catch {
            // Network error: Do nothing (keep offline session)
            console.log('[Auth] Status: Unsync Mode (Using Cached Session)');
        } finally {
            initialized = true;
        }
    }

    async function login(email: string, password: string) {
        try {
            const res = await fetch('http://localhost:3333/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            });

            if (!res.ok) {
                throw new Error('Login failed');
            }

            const data = await res.json();
            user = data.user;
            localStorage.setItem('auth_session', JSON.stringify(user));
            await ClientDB.setSession(user);
            return true;
        } catch (e) {
            console.warn('[Auth] Backend unreachable. Trying Local Auth...');

            // Local Auth Fallback (Client Authority)
            if (email === 'admin@devcms.com' && password === 'password') {
                const localUser = {
                    id: 1,
                    email: 'admin@devcms.com',
                    fullName: 'Admin User (Offline)',
                    role: 'admin'
                };
                user = localUser;
                localStorage.setItem('auth_session', JSON.stringify(user));
                await ClientDB.setSession(user);
                return true;
            }
            throw e;
        }
    }

    async function register(email: string, password: string, fullName: string) {
        const res = await fetch('http://localhost:3333/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, fullName }),
            credentials: 'include'
        });

        if (!res.ok) {
            throw new Error('Registration failed');
        }

        const data = await res.json();
        user = data.user;
        localStorage.setItem('auth_session', JSON.stringify(user));
        await ClientDB.setSession(user);
        return true;
    }

    async function logout() {
        try {
            await fetch('http://localhost:3333/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });
        } catch { } // Ignore network errors on logout

        user = null;
        if (typeof localStorage !== 'undefined') localStorage.removeItem('auth_session');
        await ClientDB.clearSession();
        window.location.href = '/'; // Hard redirect to clear any other state
    }

    return {
        get user() { return user },
        get initialized() { return initialized },
        checkAuth,
        login,
        register,
        logout
    };
}
