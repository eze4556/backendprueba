// src/app/billing/services/email.service.ts
import nodemailer from 'nodemailer';
import { load } from 'ts-dotenv';

const env = load({
    SMTP_HOST: String,
    SMTP_PORT: Number,
    SMTP_USER: String,
    SMTP_PASS: String,
    SMTP_FROM: String,
});

export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: env.SMTP_HOST,
            port: env.SMTP_PORT,
            secure: true,
            auth: {
                user: env.SMTP_USER,
                pass: env.SMTP_PASS,
            },
        });
    }

    async sendInvoiceEmail(to: string, invoiceNumber: string, pdfBuffer: Buffer) {
        try {
            console.log(`Enviando factura ${invoiceNumber} por correo a ${to}...`);

            const mailOptions = {
                from: env.SMTP_FROM,
                to: to,
                subject: `Factura #${invoiceNumber}`,
                html: `
                    <h1>Factura #${invoiceNumber}</h1>
                    <p>Estimado cliente,</p>
                    <p>Adjunto encontrará su factura #${invoiceNumber}.</p>
                    <p>Gracias por su preferencia.</p>
                    <br>
                    <p><small>Este es un correo automático, por favor no responda a este mensaje.</small></p>
                `,
                attachments: [{
                    filename: `factura-${invoiceNumber}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }]
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Correo enviado:', info.messageId);
            return true;
        } catch (error) {
            console.error('Error al enviar el correo:', error);
            throw new Error('Error al enviar el correo electrónico');
        }
    }
}