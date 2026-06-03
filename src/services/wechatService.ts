import { socketService } from './socketService';
import { User } from './authService';

export interface QrSessionInitResponse {
    uuid: string;
}

export interface QrSessionStatusResponse {
    success: boolean;
    status: string;
    user?: User;
    error?: string;
}

class WechatService {
    /**
     * Initializes a new QR-code Auth session from the server gateway.
     */
    async initQrSession(): Promise<string> {
        const res = await fetch('/api/auth/qr-init');
        if (!res.ok) {
            throw new Error('WeChat QR initialization failed on the gateway.');
        }
        const data: QrSessionInitResponse = await res.json();
        if (!data.uuid) {
            throw new Error('Invalid authentication session token returned from server.');
        }
        return data.uuid;
    }

    /**
     * Computes the scan landing URL target for scanning clients.
     */
    getScanUrl(uuid: string): string {
        return `${window.location.origin}/wechat-auth?uuid=${encodeURIComponent(uuid)}`;
    }

    /**
     * Generates a QR Code image URL via secure static encoding API.
     */
    getQrImageUrl(uuid: string): string {
        const scanUrl = this.getScanUrl(uuid);
        return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(scanUrl)}`;
    }

    /**
     * Checks status verification endpoint for a given active session.
     */
    async checkSessionStatus(uuid: string): Promise<QrSessionStatusResponse> {
        const res = await fetch(`/api/auth/qr-status/${encodeURIComponent(uuid)}`);
        if (!res.ok) {
            throw new Error('Session status validation request failed.');
        }
        return await res.json();
    }

    /**
     * Confirms the QR session from the scanning mobile agent.
     */
    async confirmSession(uuid: string, user: User): Promise<boolean> {
        const res = await fetch('/api/auth/qr-confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uuid, user })
        });
        if (!res.ok) {
            throw new Error('Network response error during scan secure verification.');
        }
        const data = await res.json();
        return !!data.success;
    }

    /**
     * Syncs authorization updates in real-time, utilizing WebSocket streams where 
     * available, with automatic HTTP polling fallback mechanism.
     */
    subscribeToSessionSync(
        uuid: string,
        onAuthenticated: (user: User) => void,
        onError?: (error: any) => void
    ): () => void {
        let active = true;
        let pollInterval: NodeJS.Timeout | null = null;
        let socketInstance: any = null;

        // WebSocket authentication event channel
        try {
            socketInstance = socketService.getSocket();
            if (socketInstance) {
                socketInstance.emit('qr:subscribe', uuid);
                socketInstance.on('qr:authenticated', (payload: { user: User }) => {
                    if (active && payload.user) {
                        onAuthenticated(payload.user);
                    }
                });
            }
        } catch (e) {
            console.warn('Real-time websocket listener setup failed. Falling back strictly to polling.', e);
        }

        // Unified HTTP background verification polling loop
        pollInterval = setInterval(async () => {
            if (!active) return;
            try {
                const check = await this.checkSessionStatus(uuid);
                if (check.success && check.status === 'confirmed' && check.user && active) {
                    onAuthenticated(check.user);
                }
            } catch (err) {
                console.error('WeChat session validation failed: ', err);
                if (onError) {
                    onError(err);
                }
            }
        }, 1500);

        // Unsubscribe teardown return function
        return () => {
            active = false;
            if (pollInterval) {
                clearInterval(pollInterval);
            }
            if (socketInstance) {
                socketInstance.off('qr:authenticated');
            }
        };
    }

    /**
     * Initializes a new WeChat Mini Program authorization session.
     */
    async initMpSession(): Promise<{ uuid: string; message: string; appletPath: string }> {
        const res = await fetch('/api/auth/mp-init');
        if (!res.ok) {
            throw new Error('WeChat MP session initialization failed.');
        }
        return await res.json();
    }

    /**
     * Subscribes to real-time Mini Program session synchronization.
     */
    subscribeToMpSync(
        uuid: string,
        onAuthenticated: (payload: { token: string; user: User }) => void,
        onError?: (error: any) => void
    ): () => void {
        let active = true;
        let pollInterval: NodeJS.Timeout | null = null;
        let socketInstance: any = null;

        try {
            socketInstance = socketService.getSocket();
            if (socketInstance) {
                socketInstance.emit('mp:subscribe', uuid);
                socketInstance.on('mp:authenticated', (payload: { token: string; user: User }) => {
                    if (active && payload.user) {
                        onAuthenticated(payload);
                    }
                });
            }
        } catch (e) {
            console.warn('WebSocket subscription failed for MP. Resorting strictly to HTTP status polling.', e);
        }

        pollInterval = setInterval(async () => {
            if (!active) return;
            try {
                const res = await fetch(`/api/auth/mp-status/${encodeURIComponent(uuid)}`);
                if (res.ok) {
                    const check = await res.json();
                    if (check.success && check.status === 'confirmed' && check.user && active) {
                        onAuthenticated(check.user);
                    }
                }
            } catch (err) {
                console.error('WeChat MP status verification polling failed:', err);
                if (onError) onError(err);
            }
        }, 1500);

        return () => {
            active = false;
            if (pollInterval) clearInterval(pollInterval);
            if (socketInstance) {
                socketInstance.off('mp:authenticated');
            }
        };
    }

    /**
     * Simulates client scans / authorizations from Mini Program.
     */
    async authorizeMp(uuid: string, openid: string, nickname: string, email?: string): Promise<boolean> {
        const res = await fetch('/api/auth/mp-authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uuid, openid, nickname, email })
        });
        if (!res.ok) {
            throw new Error('Simulation authorization failed.');
        }
        const data = await res.json();
        return !!data.success;
    }
}

export const wechatService = new WechatService();
