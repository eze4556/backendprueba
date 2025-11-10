"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transporter = exports.emailConfig = void 0;
exports.sendEmail = sendEmail;
// Email configuration for transactional emails
const nodemailer_1 = __importDefault(require("nodemailer"));
const ts_dotenv_1 = require("ts-dotenv");
const env = (0, ts_dotenv_1.load)({
    SMTP_HOST: String,
    SMTP_PORT: Number,
    SMTP_USER: String,
    SMTP_PASS: String,
    SMTP_FROM: String,
});
exports.emailConfig = {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
    from: env.SMTP_FROM
};
// Create transporter instance
exports.transporter = nodemailer_1.default.createTransport({
    host: exports.emailConfig.host,
    port: exports.emailConfig.port,
    secure: exports.emailConfig.secure,
    auth: exports.emailConfig.auth,
});
/**
 * Sends an email with the given options
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content
 * @param text - Plain text content (optional)
 * @returns Promise<boolean> - True if email was sent successfully
 */
async function sendEmail(to, subject, html, text) {
    try {
        await exports.transporter.sendMail({
            from: exports.emailConfig.from,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
        });
        return true;
    }
    catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
//# sourceMappingURL=email.config.js.map