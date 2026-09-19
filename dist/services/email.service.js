"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
let transporter = null;
function getTransporter() {
    if (!env_1.env.smtp.host || !env_1.env.smtp.user || !env_1.env.smtp.pass) {
        return null;
    }
    if (!transporter) {
        transporter = nodemailer_1.default.createTransport({
            host: env_1.env.smtp.host,
            port: env_1.env.smtp.port,
            secure: env_1.env.smtp.secure,
            auth: { user: env_1.env.smtp.user, pass: env_1.env.smtp.pass },
        });
    }
    return transporter;
}
async function sendEmail({ to, subject, html, text }) {
    const t = getTransporter();
    if (!t) {
        console.log(`\n[email:console] To: ${to}\n[email:console] Subject: ${subject}\n[email:console] Body: ${text || html}\n`);
        return;
    }
    await t.sendMail({
        from: `"${env_1.env.smtp.fromName}" <${env_1.env.smtp.fromEmail}>`,
        to,
        subject,
        html,
        text,
    });
}
//# sourceMappingURL=email.service.js.map