import PusherClient from 'pusher-js';
import { getPusherConfig } from '@/actions/settings';

// Enable pusher logging for debugging in development
if (typeof window !== 'undefined') {
    (window as any).Pusher = PusherClient;
    PusherClient.logToConsole = process.env.NODE_ENV === 'development';
}

let pusherPromise: Promise<PusherClient | null> | null = null;
let pusherInstance: PusherClient | null = null;

export async function getPusherClient(forceReconnect = false): Promise<PusherClient | null> {
    if (typeof window === 'undefined') return null;

    // Return existing instance if available and not forcing reconnect
    if (pusherInstance && !forceReconnect) return pusherInstance;

    // Return existing promise if initialization is already in progress
    if (pusherPromise && !forceReconnect) return pusherPromise;

    pusherPromise = (async () => {
        try {
            const config = await getPusherConfig();

            console.log('[Pusher Client] Initializing with:', {
                enabled: config.enabled,
                key: config.key ? config.key.substring(0, 5) + '...' : 'NONE',
                cluster: config.cluster || 'NONE'
            });

            if (!config.enabled || !config.key || !config.cluster) {
                console.warn('[Pusher Client] Aborted: Missing config');
                return null;
            }

            // Cleanup old instance if force reconnecting
            if (pusherInstance) {
                pusherInstance.disconnect();
            }

            // Simplified initialization to allow Pusher to choose best transport (ws, xhr, sse)
            pusherInstance = new PusherClient(config.key, {
                cluster: config.cluster,
                forceTLS: true,
                activityTimeout: 30000, // Faster heartbeat
            });

            pusherInstance.connection.bind('state_change', (states: any) => {
                console.log(`[Pusher Client] State: ${states.current}`);
            });

            pusherInstance.connection.bind('error', (err: any) => {
                // Better error logging for debugging
                const errorMsg = err?.error?.data?.code === 4001
                    ? 'App Key Salah atau Tidak Ditemukan'
                    : err?.message || 'WebSocket Connection Error';
                console.error('[Pusher Client] Error Detail:', {
                    message: errorMsg,
                    type: err?.type,
                    error: err?.error
                });
            });

            return pusherInstance;
        } catch (err) {
            console.error('[Pusher Client] Init failed:', err);
            return null;
        }
    })();

    return pusherPromise;
}

export function clearPusherInstance() {
    if (pusherInstance) {
        pusherInstance.disconnect();
        pusherInstance = null;
    }
    pusherPromise = null;
}
