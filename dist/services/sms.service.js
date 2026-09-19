"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = sendSms;
const env_1 = require("../config/env");
async function sendViaMsg91({ mobile, otp }) {
    if (!env_1.env.sms.msg91AuthKey || !env_1.env.sms.msg91TemplateId) {
        throw new Error('MSG91 is not configured. Set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID in .env, or set SMS_PROVIDER=console for local dev.');
    }
    const url = `https://control.msg91.com/api/v5/otp?otp=${encodeURIComponent(otp || '')}&mobile=${encodeURIComponent(mobile)}&template_id=${encodeURIComponent(env_1.env.sms.msg91TemplateId)}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            authkey: env_1.env.sms.msg91AuthKey,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`MSG91 send failed: ${response.status} ${body}`);
    }
}
async function sendViaConsole({ mobile, message }) {
    console.log(`\n[sms:console] To: ${mobile}\n[sms:console] Message: ${message}\n`);
}
async function sendSms(input) {
    switch (env_1.env.sms.provider) {
        case 'msg91':
            return sendViaMsg91(input);
        case 'console':
        default:
            return sendViaConsole(input);
    }
}
//# sourceMappingURL=sms.service.js.map