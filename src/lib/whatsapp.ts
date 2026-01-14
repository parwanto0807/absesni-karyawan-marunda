export type WhatsAppProvider = 'fonnte' | 'watzap';

export interface WhatsAppConfig {
    provider: WhatsAppProvider;
    apiKey: string;
    numberKey?: string; // For WatZap
    target: string;
}

export async function sendWhatsAppMessage(message: string, config: WhatsAppConfig) {
    const { provider, apiKey, numberKey, target } = config;

    if (!apiKey || !target) {
        console.warn('WhatsApp API Key or Target (Group ID) is missing');
        return { success: false, message: 'API Key or Target missing' };
    }

    try {
        if (provider === 'watzap') {
            if (!numberKey) {
                return { success: false, message: 'Number Key missing for WatZap' };
            }

            const response = await fetch('https://api.watzap.id/v1/send_message_group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    number_key: numberKey,
                    group_id: target,
                    message: message,
                })
            });

            const result = await response.json();
            // WatZap success response usually has status 200 and some message
            return { 
                success: result.status === '200' || result.status === 200 || result.success === true, 
                message: result.message || 'Pesan terkirim' 
            };
        } else {
            // Default to Fonnte
            const response = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: {
                    'Authorization': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target: target,
                    message: message,
                })
            });

            const result = await response.json();
            return { success: result.status, message: result.reason || 'Pesan dikirim' };
        }
    } catch (error) {
        console.error('WhatsApp Send Error:', error);
        return { success: false, message: 'Gagal mengirim pesan WhatsApp' };
    }
}
