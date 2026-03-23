require('dotenv').config();

module.exports = {
    // Telegram Configuration
    telegramToken: process.env.TELEGRAM_TOKEN || '8696408125:AAHacoL-MGWo3j8m73OSW48DFmtfwztpRWo',
    authorizedUsers: ['8746136720'],
    
    // SMTP Configuration
    smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'your-email@gmail.com',
            pass: process.env.SMTP_PASS || 'your-app-password'
        }
    },
    
    // WhatsApp Support Emails List
    supportEmails: [
        "support@support.whatsapp.com",
        "appeals@support.whatsapp.com",
        "android_web@support.whatsapp.com",
        "ios_web@support.whatsapp.com",
        "webclient_web@support.whatsapp.com",
        "1483635209301664@support.whatsapp.com",
        "support@whatsapp.com",
        "businesscomplaints@support.whatsapp.com",
        "help@whatsapp.com",
        "abuse@support.whatsapp.com",
        "security@support.whatsapp.com",
        "phishing@whatsapp.com",
        "spam@whatsapp.com",
        "legal@whatsapp.com",
        "privacy@whatsapp.com"
    ],
    
    // WhatsApp Configuration
    whatsapp: {
        sessionPath: './whatsapp-session.json'
    },
    
    // Logo URL
    logoUrl: process.env.LOGO_URL || 'https://i.ibb.co/MxqmJdqf/77560.jpg'
};
