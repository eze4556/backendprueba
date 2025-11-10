// Email configuration for transactional emails
import nodemailer from 'nodemailer';
import { load } from 'ts-dotenv';

const env = load({
    SMTP_HOST: String,
    SMTP_PORT: Number,
    SMTP_USER: String,
    SMTP_PASS: String,
    SMTP_FROM: String,
});

export const emailConfig = {
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
export const transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
});

/**
 * Sends an email with the given options
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content
 * @param text - Plain text content (optional)
 * @returns Promise<boolean> - True if email was sent successfully
 */
export async function sendEmail(
    to: string, 
    subject: string, 
    html: string, 
    text?: string
): Promise<boolean> {
    try {
        await transporter.sendMail({
            from: emailConfig.from,
            to,
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
        });
        
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
