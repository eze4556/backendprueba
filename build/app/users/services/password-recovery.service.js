"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const user_models_1 = __importDefault(require("../models/user.models"));
const password_reset_models_1 = __importDefault(require("../models/password-reset.models"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const nodemailer_1 = __importDefault(require("nodemailer"));
class PasswordRecoveryService {
    constructor() {
        // Configurar transporter de nodemailer
        this.transporter = nodemailer_1.default.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }
    /**
     * Solicitar reset de contraseña
     */
    async requestPasswordReset(email) {
        try {
            // Buscar usuario por email
            const user = await user_models_1.default.findOne({ 'primary_data.email': email.toLowerCase() });
            if (!user) {
                // Por seguridad, no revelar si el email existe o no
                return {
                    success: true,
                    message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
                };
            }
            // Invalidar todos los tokens previos del usuario
            await password_reset_models_1.default.updateMany({ userId: user._id, used: false }, { used: true });
            // Generar nuevo token único
            const token = (0, crypto_1.randomUUID)();
            // Crear registro de reset con expiración de 1 hora
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);
            await password_reset_models_1.default.create({
                userId: user._id,
                token,
                expiresAt,
                used: false
            });
            // Enviar email con link de reset
            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:4200'}/reset-password/${token}`;
            await this.sendResetEmail(email, user.primary_data.name, resetLink);
            return {
                success: true,
                message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
            };
        }
        catch (error) {
            console.error('Error en requestPasswordReset:', error);
            throw new Error('Error al procesar solicitud de recuperación de contraseña');
        }
    }
    /**
     * Validar token de reset
     */
    async validateResetToken(token) {
        try {
            const resetRecord = await password_reset_models_1.default.findOne({ token });
            if (!resetRecord) {
                return { valid: false, message: 'Token inválido' };
            }
            if (resetRecord.used) {
                return { valid: false, message: 'Este token ya fue utilizado' };
            }
            if (new Date() > resetRecord.expiresAt) {
                return { valid: false, message: 'Este token ha expirado' };
            }
            return {
                valid: true,
                message: 'Token válido',
                userId: resetRecord.userId.toString()
            };
        }
        catch (error) {
            console.error('Error en validateResetToken:', error);
            return { valid: false, message: 'Error al validar token' };
        }
    }
    /**
     * Resetear contraseña con token
     */
    async resetPassword(token, newPassword) {
        try {
            // Validar token
            const validation = await this.validateResetToken(token);
            if (!validation.valid) {
                return { success: false, message: validation.message };
            }
            // Validar fortaleza de contraseña
            if (!this.validatePasswordStrength(newPassword)) {
                return {
                    success: false,
                    message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial'
                };
            }
            // Hash de la nueva contraseña
            const hashedPassword = await bcrypt_1.default.hash(newPassword, 12);
            // Actualizar contraseña del usuario
            await user_models_1.default.findByIdAndUpdate(validation.userId, {
                $set: { 'auth_data.password': hashedPassword }
            });
            // Marcar token como usado
            await password_reset_models_1.default.findOneAndUpdate({ token }, { used: true });
            // Enviar email de confirmación
            const user = await user_models_1.default.findById(validation.userId);
            if (user) {
                await this.sendPasswordChangedEmail(user.primary_data.email, user.primary_data.name);
            }
            return {
                success: true,
                message: 'Contraseña actualizada exitosamente'
            };
        }
        catch (error) {
            console.error('Error en resetPassword:', error);
            throw new Error('Error al resetear contraseña');
        }
    }
    /**
     * Validar fortaleza de contraseña
     */
    validatePasswordStrength(password) {
        // Mínimo 8 caracteres, una mayúscula, un número, un carácter especial
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return regex.test(password);
    }
    /**
     * Enviar email de reset de contraseña
     */
    async sendResetEmail(email, name, resetLink) {
        const mailOptions = {
            from: process.env.SMTP_USER || 'noreply@likevendor.com',
            to: email,
            subject: 'Recuperación de Contraseña - LikeVendor',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${name}</strong>,</p>
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en LikeVendor.</p>
              <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Restablecer Contraseña</a>
              </div>
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${resetLink}</p>
              <div class="warning">
                ⚠️ <strong>Importante:</strong> Este enlace expirará en <strong>1 hora</strong> por seguridad.
              </div>
              <p>Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña permanecerá sin cambios.</p>
              <p>Saludos,<br><strong>El equipo de LikeVendor</strong></p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas a este mensaje.</p>
              <p>&copy; ${new Date().getFullYear()} LikeVendor. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
        };
        await this.transporter.sendMail(mailOptions);
    }
    /**
     * Enviar email de confirmación de cambio de contraseña
     */
    async sendPasswordChangedEmail(email, name) {
        const mailOptions = {
            from: process.env.SMTP_USER || 'noreply@likevendor.com',
            to: email,
            subject: 'Contraseña Actualizada - LikeVendor',
            html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Contraseña Actualizada</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${name}</strong>,</p>
              <div class="success">
                ✓ Tu contraseña ha sido actualizada exitosamente.
              </div>
              <p>Este es un email de confirmación para informarte que tu contraseña fue cambiada el <strong>${new Date().toLocaleString('es-ES')}</strong>.</p>
              <p>Si NO realizaste este cambio, contacta inmediatamente a nuestro equipo de soporte.</p>
              <p>Saludos,<br><strong>El equipo de LikeVendor</strong></p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} LikeVendor. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
        };
        await this.transporter.sendMail(mailOptions);
    }
}
exports.default = new PasswordRecoveryService();
//# sourceMappingURL=password-recovery.service.js.map