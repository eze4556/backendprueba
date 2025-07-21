import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import UserModel from '../models/user.models';

const JWT_SECRET = process.env.JWT_SECRET || 'test';

// Middleware para verificar el token JWT
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.replace('Bearer ', '');
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }
      (req as any).user = decoded as JwtPayload;
      next();
    });
  } catch (error: any) {
    return res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
}

export async function checkActive(req: Request, res: Response, next: NextFunction) {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.permissions.active) return res.status(403).json({ message: 'User is not active' });
  next();
}

export async function checkEmail(req: Request, res: Response, next: NextFunction) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  try {
    // Buscar en la estructura anidada primary_data.email
    const user = await UserModel.findOne({ 'primary_data.email': email.toLowerCase() });
    if (user) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    next();
  } catch (error) {
    console.error('Error in checkEmail middleware:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
}