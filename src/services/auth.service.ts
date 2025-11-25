import jwt from 'jsonwebtoken';
import { load } from 'ts-dotenv';
import bcrypt from 'bcryptjs';
import { Request } from 'express';

const env = load({
  JWT_KEY: {
    type: String,
    optional: true
  },
  JWT_EXPIRES_IN: {
    type: String,
    optional: true
  },
});

export interface TokenPayload {
  userId: string;
  email: string;
  roles: string[];
}

class AuthService {
  private readonly jwtKey: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtKey = env.JWT_KEY || process.env.JWT_SECRET || process.env.JWT_KEY || 'secure_secret_for_dev_only';
    this.jwtExpiresIn = env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Genera un token JWT
   * @param payload Datos a incluir en el token
   */
  public generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.jwtKey, { expiresIn: this.jwtExpiresIn });
  }

  /**
   * Verifica y decodifica un token JWT
   * @param token Token a verificar
   */
  public verifyToken(token: string): TokenPayload {
    try {
      const decoded = jwt.verify(token, this.jwtKey);
      
      // Verificar que sea un objeto y no un string
      if (typeof decoded === 'string') {
        throw new Error('Token format is invalid');
      }
      
      // Verificar que tenga las propiedades requeridas de TokenPayload
      if (!decoded.userId || !decoded.roles) {
        throw new Error('Token payload is incomplete');
      }
      
      return decoded as unknown as TokenPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Extrae el token de los headers de la request
   * @param req Express Request
   */
  public extractTokenFromRequest(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader) return null;

    const [bearer, token] = authHeader.split(' ');
    return bearer === 'Bearer' ? token : null;
  }

  /**
   * Hashea una contraseña
   * @param password Contraseña a hashear
   */
  public async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Compara una contraseña con su hash
   * @param password Contraseña a verificar
   * @param hash Hash almacenado
   */
  public async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

export default new AuthService();