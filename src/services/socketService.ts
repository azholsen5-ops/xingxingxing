import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;
    private listeners: ((onlineIds: string[]) => void)[] = [];

    connect(userId: string) {
        if (this.socket) return;

        this.socket = io(window.location.origin);

        this.socket.on('connect', () => {
            console.log('Socket connected');
            this.socket?.emit('auth:init', userId);
        });

        this.socket.on('presence:update', (onlineIds: string[]) => {
            this.listeners.forEach(cb => cb(onlineIds));
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    onPresenceUpdate(callback: (onlineIds: string[]) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    }
}

export const socketService = new SocketService();
