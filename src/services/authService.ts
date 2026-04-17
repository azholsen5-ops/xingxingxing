export interface User {
    id: string;
    username: string;
    name: string;
    className?: string;
    avatar?: string;
}

class AuthService {
    private currentUser: User | null = null;
    private token: string | null = null;

    constructor() {
        const storedToken = localStorage.getItem('xh_token');
        const storedUser = localStorage.getItem('xh_user');
        if (storedToken && storedUser) {
            this.token = storedToken;
            this.currentUser = JSON.parse(storedUser);
        }
    }

    async register(data: any) {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await res.json();
    }

    async login(data: any) {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            this.token = result.token;
            this.currentUser = result.user;
            localStorage.setItem('xh_token', result.token);
            localStorage.setItem('xh_user', JSON.stringify(result.user));
        }
        return result;
    }

    logout() {
        this.currentUser = null;
        this.token = null;
        localStorage.removeItem('xh_token');
        localStorage.removeItem('xh_user');
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getToken() {
        return this.token;
    }

    isAuthenticated() {
        return !!this.token;
    }
}

export const authService = new AuthService();
