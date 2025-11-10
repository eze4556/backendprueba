/**
 * Configuración centralizada para JWT
 * Este archivo centraliza la configuración de JWT para evitar inconsistencias
 */

// Utilizar JWT_SECRET como variable principal, con fallback a JWT_KEY para compatibilidad
export const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_KEY || 'secure_secret_for_dev_only';

// Configuración adicional para JWT
export const JWT_CONFIG = {
  secret: JWT_SECRET,
  expiresIn: '24h', // Tokens válidos por 24 horas
  issuer: 'like-vendor-backend',
  audience: 'like-vendor-app'
};

// Validar que tenemos un secreto configurado
if (JWT_SECRET === 'secure_secret_for_dev_only' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  ADVERTENCIA: Usando secreto JWT por defecto en producción. Configure JWT_SECRET en las variables de entorno.');
}