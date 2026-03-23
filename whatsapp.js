const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const config = require('./config');

class WhatsAppManager {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.qrCodeGenerated = null;
    }
    
    async initialize() {
        this.client = new Client({
            authStrategy: new LocalAuth({
                clientId: "dora-bot",
                dataPath: config.whatsapp.sessionPath
            }),
            puppeteer: {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            }
        });
        
        this.client.on('qr', async (qr) => {
            console.log('WhatsApp QR Code received');
            this.qrCodeGenerated = qr;
            try {
                const qrImage = await qrcode.toDataURL(qr);
                this.qrCodeDataURL = qrImage;
            } catch (err) {
                console.error('QR generation error:', err);
            }
        });
        
        this.client.on('ready', () => {
            console.log('WhatsApp is ready!');
            this.isReady = true;
        });
        
        this.client.on('auth_failure', (msg) => {
            console.error('WhatsApp auth failure:', msg);
        });
        
        await this.client.initialize();
    }
    
    async sendMessage(to, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp not ready yet');
        }
        
        try {
            let cleanNumber = to.replace(/[^0-9]/g, '');
            if (!cleanNumber.endsWith('@c.us')) {
                cleanNumber = `${cleanNumber}@c.us`;
            }
            
            const chat = await this.client.getChatById(cleanNumber);
            const response = await chat.sendMessage(message);
            return { success: true, messageId: response.id._serialized };
        } catch (error) {
            console.error('WhatsApp send error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async getQRCode() {
        return this.qrCodeGenerated;
    }
    
    getStatus() {
        return {
            isReady: this.isReady,
            hasQR: !!this.qrCodeGenerated
        };
    }
}

module.exports = WhatsAppManager;
