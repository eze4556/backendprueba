import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request interface
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                isProvider: boolean;
                email?: string;
                role?: string;
            };
        }
    }
}

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Replace with your actual secret

const providerAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; isProvider: boolean; email?: string; role?: string };

        if (!decoded.isProvider) {
            return res.status(403).json({ error: 'Unauthorized: Provider role required' });
        }

        req.user = {
            id: decoded.id,
            isProvider: decoded.isProvider,
            email: decoded.email || '',
            role: decoded.role || '',
        };

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

export default providerAuthMiddleware;