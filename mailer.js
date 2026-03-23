const nodemailer = require('nodemailer');
const config = require('./config');

class Mailer {
    constructor() {
        this.transporter = nodemailer.createTransport(config.smtp);
        this.supportEmails = config.supportEmails;
    }
    
    async sendEmail(to, subject, body, isHtml = false) {
        try {
            const mailOptions = {
                from: config.smtp.auth.user,
                to: to,
                subject: subject,
                [isHtml ? 'html' : 'text']: body
            };
            
            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Email error:', error);
            return { success: false, error: error.message };
        }
    }
    
    // WhatsApp Support Emails එකවර යැවීම
    async sendToSupportEmails(subject, message, reportType = 'general') {
        const results = [];
        const emailBody = `
📢 *Support Report*
━━━━━━━━━━━━━━━━━━━
Type: ${reportType}
Time: ${new Date().toLocaleString()}
Message: ${message}
━━━━━━━━━━━━━━━━━━━
        `;
        
        for (const email of this.supportEmails) {
            console.log(`Sending to: ${email}`);
            const result = await this.sendEmail(email, subject, emailBody);
            results.push({ email, ...result });
            
            // Rate limiting - wait 1 second between emails
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return results;
    }
    
    // විශේෂිත Support Email එකකට යැවීම
    async sendToSpecificSupport(email, subject, message) {
        if (!this.supportEmails.includes(email)) {
            return { success: false, error: 'Email not in support list' };
        }
        return await this.sendEmail(email, subject, message);
    }
    
    async sendAutoEmail(trigger, data) {
        const subjects = {
            'command': 'Command Executed',
            'alert': 'System Alert',
            'report': 'Daily Report',
            'support': 'Support Request'
        };
        
        const subject = subjects[trigger] || 'Auto Email from Bot';
        const body = `Trigger: ${trigger}\nTime: ${data.timestamp || new Date().toISOString()}\nUser: ${data.user || 'Unknown'}\nData: ${JSON.stringify(data, null, 2)}`;
        
        // Send to first support email as default
        return await this.sendEmail(this.supportEmails[0], subject, body);
    }
    
    getSupportEmailsList() {
        return this.supportEmails;
    }
}

module.exports = Mailer;
