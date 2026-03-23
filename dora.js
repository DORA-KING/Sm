const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const Mailer = require('./mailer');
const WhatsAppManager = require('./whatsapp');
const axios = require('axios');

const bot = new Telegraf(config.telegramToken);
const mailer = new Mailer();
const whatsapp = new WhatsAppManager();

whatsapp.initialize().catch(console.error);

// =============== STYLISH TEXT FUNCTIONS ===============
const stylish = {
    title: (text) => `✨ *${text}* ✨`,
    line: () => `━━━━━━━━━━━━━━━━━━━`,
    bold: (text) => `*${text}*`,
    italic: (text) => `_${text}_`,
    code: (text) => `\`${text}\``,
    spoiler: (text) => `||${text}||`,
    // Stylish Unicode Fonts
    serif: (text) => text.split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 120171)).join(''),
    boldSerif: (text) => text.split('').map(c => String.fromCodePoint(c.charCodeAt(0) + 120227)).join('')
};

// =============== MAIN MENU BUTTONS ===============
const mainMenu = Markup.inlineKeyboard([
    [Markup.button.callback('📧 SEND EMAIL', 'menu_email')],
    [Markup.button.callback('📨 SUPPORT EMAILS', 'menu_support')],
    [Markup.button.callback('💬 WHATSAPP', 'menu_whatsapp')],
    [Markup.button.callback('📊 STATUS', 'menu_status')],
    [Markup.button.callback('ℹ️ HELP', 'menu_help')],
    [Markup.button.callback('🔐 ABOUT', 'menu_about')]
]);

const emailMenu = Markup.inlineKeyboard([
    [Markup.button.callback('📧 Send Custom Email', 'email_custom')],
    [Markup.button.callback('📨 Send to Support', 'email_support')],
    [Markup.button.callback('🔙 Back to Main', 'back_main')]
]);

const supportEmailMenu = Markup.inlineKeyboard([
    [Markup.button.callback('📨 Send to ALL Support', 'support_all')],
    [Markup.button.callback('🔍 View Support List', 'support_list')],
    [Markup.button.callback('🔙 Back to Email', 'back_email')]
]);

const whatsappMenu = Markup.inlineKeyboard([
    [Markup.button.callback('✅ Check Status', 'wa_status')],
    [Markup.button.callback('📱 Get QR Code', 'wa_qr')],
    [Markup.button.callback('📝 Send Message', 'wa_send')],
    [Markup.button.callback('📤 Send to Me', 'wa_sendtome')],
    [Markup.button.callback('🔙 Back to Main', 'back_main')]
]);

// =============== LOGO DISPLAY ===============
async function sendLogo(ctx) {
    try {
        await ctx.replyWithPhoto(config.logoUrl, {
            caption: `${stylish.title('DORA BOT')}\n\n${stylish.boldSerif('Your Smart Assistant Bot')}\n\n⚡ Fast & Reliable\n🔒 Secure & Private\n📧 Email Support\n💬 WhatsApp Integration`,
            parse_mode: 'Markdown'
        });
    } catch (error) {
        console.error('Logo error:', error);
    }
}

// =============== START COMMAND ===============
bot.start(async (ctx) => {
    const userName = ctx.from.first_name || ctx.from.username || 'User';
    
    await sendLogo(ctx);
    
    const welcomeMsg = `
${stylish.title('WELCOME TO DORA BOT')}
${stylish.line()}

${stylish.boldSerif('Hello')} ${stylish.boldSerif(userName)}! 👋

${stylish.italic('I am your smart assistant with:')}

📧 *Email Features:*
• Send custom emails
• Send to WhatsApp support emails (${config.supportEmails.length} addresses)
• Auto email reports

💬 *WhatsApp Features:*
• Send WhatsApp messages
• QR code authentication
• Easy messaging

━━━━━━━━━━━━━━━━━━━
${stylish.bold('Select an option below:')} 👇
    `;
    
    await ctx.reply(welcomeMsg, {
        parse_mode: 'Markdown',
        ...mainMenu
    });
});

// =============== ABOUT COMMAND ===============
bot.command('about', async (ctx) => {
    const aboutMsg = `
${stylish.title('ABOUT DORA BOT')}
${stylish.line()}

🤖 *Bot Name:* Dora Bot
📌 *Version:* 2.0.0
👨‍💻 *Type:* Smart Assistant
📧 *Support Emails:* ${config.supportEmails.length} addresses
💬 *WhatsApp:* Ready

*Features:*
• Send emails via SMTP
• Send to WhatsApp support emails
• WhatsApp messaging
• QR authentication
• Real-time status

━━━━━━━━━━━━━━━━━━━
${stylish.italic('Your trusted assistant!')}
    `;
    await ctx.reply(aboutMsg, { parse_mode: 'Markdown', ...mainMenu });
});

// =============== SUPPORT EMAILS LIST ===============
bot.command('supportlist', async (ctx) => {
    let listMsg = `${stylish.title('WHATSAPP SUPPORT EMAILS')}\n${stylish.line()}\n\n`;
    
    config.supportEmails.forEach((email, index) => {
        listMsg += `${index + 1}. ${stylish.code(email)}\n`;
    });
    
    listMsg += `\n${stylish.line()}\nTotal: ${config.supportEmails.length} emails\n\nUse /sendtosupport [subject] [message] to send to all`;
    
    await ctx.reply(listMsg, { parse_mode: 'Markdown', ...supportEmailMenu });
});

// =============== SEND TO SUPPORT EMAILS ===============
bot.command('sendtosupport', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
        return ctx.reply(`❌ *Usage:* /sendtosupport [subject] [message]\n\nExample:\n/sendtosupport Report "Something went wrong"`, { parse_mode: 'Markdown' });
    }
    
    const subject = args[0];
    const message = args.slice(1).join(' ');
    
    ctx.reply(`📨 Sending to ${config.supportEmails.length} support emails...\n⏳ Please wait...`);
    
    const results = await mailer.sendToSupportEmails(subject, message, 'user_report');
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    const resultMsg = `
${stylish.title('EMAIL SENT RESULTS')}
${stylish.line()}

✅ *Success:* ${successCount}
❌ *Failed:* ${failCount}
📧 *Total:* ${config.supportEmails.length}

${successCount > 0 ? '📨 Emails sent successfully!' : '⚠️ All emails failed!'}
    `;
    
    await ctx.reply(resultMsg, { parse_mode: 'Markdown', ...mainMenu });
});

// =============== CUSTOM EMAIL ===============
bot.command('email', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 3) {
        return ctx.reply(`❌ *Usage:* /email [address] [subject] [message]\n\nExample:\n/email example@gmail.com Hello "How are you?"`, { parse_mode: 'Markdown' });
    }
    
    const to = args[0];
    const subject = args[1];
    const message = args.slice(2).join(' ');
    
    ctx.reply(`📧 Sending email to ${stylish.code(to)}...`);
    
    const result = await mailer.sendEmail(to, subject, message);
    
    if (result.success) {
        await ctx.reply(`✅ *Email Sent Successfully!*\n📨 Message ID: ${result.messageId}`, { parse_mode: 'Markdown', ...mainMenu });
    } else {
        await ctx.reply(`❌ *Email Failed!*\n⚠️ Error: ${result.error}`, { parse_mode: 'Markdown', ...mainMenu });
    }
});

// =============== STATUS COMMAND ===============
bot.command('status', async (ctx) => {
    const waStatus = whatsapp.getStatus();
    const uptime = process.uptime();
    const uptimeStr = `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
    
    const statusMsg = `
${stylish.title('BOT STATUS')}
${stylish.line()}

🤖 *Bot:* ✅ Active
📧 *SMTP:* ✅ Ready
📨 *Support Emails:* ${config.supportEmails.length} addresses
💬 *WhatsApp:* ${waStatus.isReady ? '✅ Connected' : '⏳ Initializing...'}
⏱️ *Uptime:* ${uptimeStr}
👤 *User ID:* \`${ctx.from.id}\`

${waStatus.hasQR ? '📱 *QR Ready:* /whatsapp_qr' : ''}
━━━━━━━━━━━━━━━━━━━
    `;
    await ctx.reply(statusMsg, { parse_mode: 'Markdown', ...mainMenu });
});

// =============== HELP COMMAND ===============
bot.command('help', async (ctx) => {
    const helpMsg = `
${stylish.title('HELP & COMMANDS')}
${stylish.line()}

*📧 EMAIL COMMANDS:*
/email [addr] [subj] [msg] - Send custom email
/sendtosupport [subj] [msg] - Send to all support emails
/supportlist - View support emails list

*💬 WHATSAPP COMMANDS:*
/sendwa [number] [msg] - Send WhatsApp message
/sendtome [msg] - Send to your WhatsApp
/whatsapp_status - Check WhatsApp status
/whatsapp_qr - Get QR code

*🔧 OTHER COMMANDS:*
/start - Start the bot
/status - Check bot status
/about - About this bot
/help - Show this help

━━━━━━━━━━━━━━━━━━━
${stylish.italic('Use buttons for easier navigation!')} 👇
    `;
    await ctx.reply(helpMsg, { parse_mode: 'Markdown', ...mainMenu });
});

// =============== WHATSAPP COMMANDS ===============
bot.command('whatsapp_status', async (ctx) => {
    const status = whatsapp.getStatus();
    let msg = status.isReady 
        ? '✅ *WhatsApp Ready!*\nUse /sendwa to send messages.'
        : '⏳ *WhatsApp Initializing...*\nUse /whatsapp_qr to scan QR code.';
    await ctx.reply(msg, { parse_mode: 'Markdown' });
});

bot.command('whatsapp_qr', async (ctx) => {
    const status = whatsapp.getStatus();
    if (status.isReady) {
        return ctx.reply('✅ WhatsApp already connected!');
    }
    const qr = await whatsapp.getQRCode();
    if (qr) {
        await ctx.reply('📱 *Scan this QR code with WhatsApp:*');
        await ctx.reply(`\`${qr}\``, { parse_mode: 'Markdown' });
    } else {
        await ctx.reply('⚠️ QR code not ready. Please wait and try again.');
    }
});

bot.command('sendwa', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 2) {
        return ctx.reply('❌ *Usage:* /sendwa [number] [message]\n\nExample:\n/sendwa 94771234567 Hello there!', { parse_mode: 'Markdown' });
    }
    
    const phone = args[0];
    const message = args.slice(1).join(' ');
    
    if (!whatsapp.getStatus().isReady) {
        return ctx.reply('⚠️ WhatsApp not ready! Use /whatsapp_qr first.');
    }
    
    ctx.reply(`💬 Sending to ${phone}...`);
    const result = await whatsapp.sendMessage(phone, message);
    
    if (result.success) {
        await ctx.reply(`✅ *WhatsApp Message Sent!*\n📞 To: ${phone}`, { parse_mode: 'Markdown' });
    } else {
        await ctx.reply(`❌ *Failed!*\n⚠️ ${result.error}`, { parse_mode: 'Markdown' });
    }
});

bot.command('sendtome', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 1) {
        return ctx.reply('❌ *Usage:* /sendtome [message]', { parse_mode: 'Markdown' });
    }
    
    const message = args.join(' ');
    const myNumber = '94771234567'; // ඔබගේ WhatsApp අංකය මෙතන දාන්න
    
    if (!whatsapp.getStatus().isReady) {
        return ctx.reply('⚠️ WhatsApp not ready! Use /whatsapp_qr first.');
    }
    
    ctx.reply(`💬 Sending to your WhatsApp...`);
    const result = await whatsapp.sendMessage(myNumber, `📱 From Telegram:\n${message}\n\nTime: ${new Date().toLocaleString()}`);
    
    if (result.success) {
        await ctx.reply(`✅ Message sent to your WhatsApp!`);
    } else {
        await ctx.reply(`❌ Failed: ${result.error}`);
    }
});

// =============== BUTTON HANDLERS ===============
bot.action('menu_email', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('📧 *Email Options*\n\nSelect an option below:', {
        parse_mode: 'Markdown',
        ...emailMenu
    });
});

bot.action('menu_support', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(`📨 *WhatsApp Support Emails*\n\nTotal: ${config.supportEmails.length} email addresses\n\nSelect an option:`, {
        parse_mode: 'Markdown',
        ...supportEmailMenu
    });
});

bot.action('menu_whatsapp', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('💬 *WhatsApp Options*\n\nSelect an option below:', {
        parse_mode: 'Markdown',
        ...whatsappMenu
    });
});

bot.action('menu_status', async (ctx) => {
    await ctx.answerCbQuery();
    const waStatus = whatsapp.getStatus();
    const uptime = process.uptime();
    const uptimeStr = `${Math.floor(uptime / 86400)}d ${Math.floor((uptime % 86400) / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`;
    
    const msg = `${stylish.title('STATUS')}\n${stylish.line()}\n\n🤖 Bot: ✅ Active\n📧 SMTP: ✅ Ready\n📨 Support: ${config.supportEmails.length} emails\n💬 WhatsApp: ${waStatus.isReady ? '✅ Connected' : '⏳ Init'}\n⏱️ Uptime: ${uptimeStr}`;
    
    await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...mainMenu });
});

bot.action('menu_help', async (ctx) => {
    await ctx.answerCbQuery();
    const msg = `${stylish.title('HELP')}\n${stylish.line()}\n\n/email - Send email\n/sendtosupport - Send to all support\n/supportlist - View support list\n/sendwa - Send WhatsApp\n/status - Bot status\n/about - About bot`;
    await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...mainMenu });
});

bot.action('menu_about', async (ctx) => {
    await ctx.answerCbQuery();
    const msg = `${stylish.title('ABOUT')}\n${stylish.line()}\n\n🤖 Dora Bot v2.0\n📧 ${config.supportEmails.length} Support Emails\n💬 WhatsApp Integration\n🔒 Private & Secure`;
    await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...mainMenu });
});

bot.action('email_custom', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('📧 *Send Custom Email*\n\nUsage:\n`/email [address] [subject] [message]`\n\nExample:\n`/email example@gmail.com Hello "How are you?"`', {
        parse_mode: 'Markdown',
        ...emailMenu
    });
});

bot.action('email_support', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('📨 *Send to Support*\n\nUsage:\n`/sendtosupport [subject] [message]`\n\nThis will send to all ${config.supportEmails.length} WhatsApp support emails.', {
        parse_mode: 'Markdown',
        ...supportEmailMenu
    });
});

bot.action('support_all', async (ctx) => {
    await ctx.answerCbQuery('Please use /sendtosupport command');
    await ctx.reply('📨 *Send to All Support Emails*\n\nUsage: `/sendtosupport [subject] [message]`\n\nExample:\n`/sendtosupport Report "Issue with WhatsApp"`', {
        parse_mode: 'Markdown'
    });
});

bot.action('support_list', async (ctx) => {
    await ctx.answerCbQuery();
    let list = `📨 *Support Emails List*\n\n`;
    config.supportEmails.forEach((email, i) => {
        list += `${i+1}. \`${email}\`\n`;
    });
    await ctx.editMessageText(list, { parse_mode: 'Markdown', ...supportEmailMenu });
});

bot.action('wa_status', async (ctx) => {
    await ctx.answerCbQuery();
    const status = whatsapp.getStatus();
    const msg = status.isReady 
        ? '✅ *WhatsApp Ready!*\nUse /sendwa to send messages.'
        : '⏳ *WhatsApp Initializing...*\nUse /whatsapp_qr to scan QR code.';
    await ctx.editMessageText(msg, { parse_mode: 'Markdown', ...whatsappMenu });
});

bot.action('wa_qr', async (ctx) => {
    await ctx.answerCbQuery();
    const status = whatsapp.getStatus();
    if (status.isReady) {
        await ctx.reply('✅ WhatsApp already connected!');
        return;
    }
    const qr = await whatsapp.getQRCode();
    if (qr) {
        await ctx.reply('📱 *Scan this QR code:*');
        await ctx.reply(`\`${qr}\``, { parse_mode: 'Markdown' });
    } else {
        await ctx.reply('⚠️ QR code not ready. Please wait.');
    }
});

bot.action('wa_send', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('💬 *Send WhatsApp Message*\n\nUsage:\n`/sendwa [number] [message]`\n\nExample:\n`/sendwa 94771234567 Hello!`', {
        parse_mode: 'Markdown'
    });
});

bot.action('wa_sendtome', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.reply('📤 *Send to Your WhatsApp*\n\nUsage:\n`/sendtome [message]`\n\nExample:\n`/sendtome Hello from bot!`', {
        parse_mode: 'Markdown'
    });
});

bot.action('back_email', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('📧 *Email Options*\n\nSelect an option:', {
        parse_mode: 'Markdown',
        ...emailMenu
    });
});

bot.action('back_main', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('📋 *Main Menu*\n\nSelect an option below:', {
        parse_mode: 'Markdown',
        ...mainMenu
    });
});

// =============== ERROR HANDLER ===============
bot.catch((err, ctx) => {
    console.error('Bot error:', err);
    ctx.reply('⚠️ An error occurred. Please try again.');
});

// =============== START BOT ===============
bot.launch()
    .then(() => {
        console.log('🤖 DORA BOT is running...');
        console.log('📧 SMTP Mailer ready');
        console.log(`📨 Support Emails: ${config.supportEmails.length} addresses`);
        console.log('💬 WhatsApp initializing...');
        console.log('✅ Authorized User: 8746136720');
    })
    .catch(console.error);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;
