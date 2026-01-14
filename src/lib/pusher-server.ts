import Pusher from 'pusher';
import { prisma } from './db';

export async function getPusherServer() {
    const settings = await prisma.setting.findMany({
        where: {
            key: {
                in: ['PUSHER_APP_ID', 'PUSHER_KEY', 'PUSHER_SECRET', 'PUSHER_CLUSTER', 'PUSHER_ENABLE']
            }
        }
    });

    const config: Record<string, string> = {};
    settings.forEach(s => {
        config[s.key] = s.value;
    });

    if (config.PUSHER_ENABLE !== 'true') return null;

    if (!config.PUSHER_APP_ID || !config.PUSHER_KEY || !config.PUSHER_SECRET || !config.PUSHER_CLUSTER) {
        console.warn('Pusher config incomplete');
        return null;
    }

    return new Pusher({
        appId: config.PUSHER_APP_ID,
        key: config.PUSHER_KEY,
        secret: config.PUSHER_SECRET,
        cluster: config.PUSHER_CLUSTER,
        useTLS: true,
    });
}

export async function triggerPusher(channel: string, event: string, data: any) {
    try {
        console.log(`Triggering Pusher: ${channel} -> ${event}`);
        const pusher = await getPusherServer();
        if (pusher) {
            await pusher.trigger(channel, event, data);
            console.log('Pusher triggered successfully');
            return true;
        } else {
            console.warn('Pusher not triggered: Server instance not available (possibly disabled)');
        }
    } catch (error) {
        console.error('Pusher Trigger Error:', error);
    }
    return false;
}
