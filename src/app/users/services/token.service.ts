import { randomUUID } from 'crypto';
import jwt from 'jsonwebtoken';
import RefreshTokenModel from '../models/refresh-token.models';
import { load } from 'ts-dotenv';

const env = load({
  JWT_KEY: String,
  JWT_REFRESH_SECRET: {
    type: String,
    optional: true
  }
});

const JWT_SECRET = env.JWT_KEY;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET || env.JWT_KEY + '_refresh';

class TokenService {
  /**
   * Generar access token (JWT)
   */
  generateAccessToken(userId: string, email: string, role?: string): string {
    return jwt.sign(
      {
        userId,
        email,
        role: role || 'user'
      },
      JWT_SECRET,
      { expiresIn: '24h' } // 24 horas
    );
  }

  /**
   * Generar refresh token
   */
  async generateRefreshToken(
    userId: string,
    ip?: string,
    userAgent?: string
  ): Promise<string> {
    const token = randomUUID();
    
    // Expiración de 7 días
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await RefreshTokenModel.create({
      userId,
      token,
      expiresAt,
      ip,
      userAgent
    });

    return token;
  }

  /**
   * Validar y renovar access token usando refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    message: string;
  }> {
    try {
      // Buscar refresh token en BD
      const tokenRecord = await RefreshTokenModel.findOne({ token: refreshToken })
        .populate('userId');

      if (!tokenRecord) {
        return {
          success: false,
          message: 'Refresh token inválido'
        };
      }

      // Verificar expiración
      if (new Date() > tokenRecord.expiresAt) {
        // Eliminar token expirado
        await RefreshTokenModel.deleteOne({ token: refreshToken });
        return {
          success: false,
          message: 'Refresh token expirado'
        };
      }

      // Obtener datos del usuario
      const user = tokenRecord.userId as any;

      // Generar nuevo access token
      const newAccessToken = this.generateAccessToken(
        user._id.toString(),
        user.primary_data.email,
        user.primary_data.type
      );

      return {
        success: true,
        accessToken: newAccessToken,
        message: 'Token renovado exitosamente'
      };
    } catch (error) {
      console.error('Error en refreshAccessToken:', error);
      return {
        success: false,
        message: 'Error al renovar token'
      };
    }
  }

  /**
   * Invalidar refresh token (logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<boolean> {
    try {
      const result = await RefreshTokenModel.deleteOne({ token: refreshToken });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error al revocar refresh token:', error);
      return false;
    }
  }

  /**
   * Invalidar todos los refresh tokens de un usuario (logout de todos los dispositivos)
   */
  async revokeAllUserTokens(userId: string): Promise<boolean> {
    try {
      await RefreshTokenModel.deleteMany({ userId });
      return true;
    } catch (error) {
      console.error('Error al revocar tokens del usuario:', error);
      return false;
    }
  }

  /**
   * Verificar access token
   */
  verifyAccessToken(token: string): {
    valid: boolean;
    decoded?: any;
    message: string;
  } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return {
        valid: true,
        decoded,
        message: 'Token válido'
      };
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          message: 'Token expirado'
        };
      }
      return {
        valid: false,
        message: 'Token inválido'
      };
    }
  }
}

export default new TokenService();
