export async function sendWhatsAppMessage(message: string, target: string, apiKey: string) {
    if (!apiKey || !target) {
        console.warn('WhatsApp API Key or Target (Group ID) is missing');
        return { success: false, message: 'API Key or Target missing' };
    }

    try {
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
    } catch (error) {
        console.error('WhatsApp Send Error:', error);
        return { success: false, message: 'Gagal mengirim pesan WhatsApp' };
    }
}
