export interface User {
    id: string;
    username: string;
    name: string;
    className?: string;
    avatar?: string;
    category?: 'core' | 'service';
    intro?: string;
    email?: string | null;
    wechat_openid?: string | null;
    wechat_nickname?: string | null;
}

class AuthService {
    private currentUser: User | null = null;
    private token: string | null = null;

    constructor() {
        const storedToken = localStorage.getItem('xh_token');
        const storedUser = localStorage.getItem('xh_user');
        if (storedToken && storedUser) {
            this.token = storedToken;
            try {
                this.currentUser = JSON.parse(storedUser);
            } catch (e) {
                this.currentUser = null;
            }
        }
    }

    updateCurrentUserObject(user: User) {
        this.currentUser = user;
        localStorage.setItem('xh_user', JSON.stringify(user));
    }

    async updateProfile(data: Partial<User>) {
        if (!this.token) throw new Error('Not authenticated');
        const res = await fetch('/api/auth/profile', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            this.currentUser = result.user;
            localStorage.setItem('xh_user', JSON.stringify(result.user));
        }
        return result;
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

    // High fidelity simulated login mechanisms
    async sendSmsVerify(phone: string): Promise<{ success: boolean; code?: string; error?: string }> {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        return { success: true, code };
    }

    async sendEmailVerify(email: string): Promise<{ success: boolean; code?: string; error?: string }> {
        const code = Math.floor(1000 + Math.random() * 9000).toString();
        return { success: true, code };
    }

    async loginWithSms(phone: string, code: string): Promise<{ success: boolean; user: User; error?: string }> {
        const mockUser: User = {
            id: 'sms_' + Date.now().toString(),
            username: 'sms_' + phone.slice(-4),
            name: `成员 ${phone.slice(0, 3)}****${phone.slice(-4)}`,
            className: '应急23-1班',
            category: 'core',
            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${phone}&backgroundColor=b6e3f4,c0aede,d1d4f9&hairColor=000000,101010&skinColor=ffd1a9,f1c27d,e8b584`,
            intro: '星河科创临时短信授权登录'
        };
        this.token = 'mock_sms_token_' + Date.now();
        this.currentUser = mockUser;
        localStorage.setItem('xh_token', this.token);
        localStorage.setItem('xh_user', JSON.stringify(mockUser));
        return { success: true, user: mockUser };
    }

    async loginWithEmail(email: string, code: string): Promise<{ success: boolean; user: User; error?: string }> {
        const mockUser: User = {
            id: 'email_' + Date.now().toString(),
            username: email.split('@')[0],
            name: `安全之星 (${email.split('@')[0]})`,
            className: '安全23-2班',
            category: 'core',
            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${email}&backgroundColor=b6e3f4,c0aede,d1d4f9&hairColor=000000,101010&skinColor=ffd1a9,f1c27d,e8b584`,
            intro: '星河科创安全邮箱验证登入'
        };
        this.token = 'mock_email_token_' + Date.now();
        this.currentUser = mockUser;
        localStorage.setItem('xh_token', this.token);
        localStorage.setItem('xh_user', JSON.stringify(mockUser));
        return { success: true, user: mockUser };
    }

    async loginQuick(username: string): Promise<{ success: boolean; user: User; error?: string }> {
        // Find in history or generate
        const mockUser: User = {
            id: 'quick_' + Date.now().toString(),
            username: username,
            name: username === 'lupeng' ? '陆鹏 (协会研习主管)' : '王傲星 (安全运维)',
            className: username === 'lupeng' ? '安全23-2班' : '信安24-1班',
            category: 'core',
            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}&backgroundColor=b6e3f4,c0aede,d1d4f9&hairColor=000000,101010&skinColor=ffd1a9,f1c27d,e8b584`,
            intro: username === 'lupeng' ? '星河科创核心组长 · 快捷终端一键授权' : '星河网络防御中心讲师 · 本地快捷登录'
        };
        this.token = 'mock_quick_token_' + Date.now();
        this.currentUser = mockUser;
        localStorage.setItem('xh_token', this.token);
        localStorage.setItem('xh_user', JSON.stringify(mockUser));
        return { success: true, user: mockUser };
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
