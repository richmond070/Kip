import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getCurrentJwtKey } from '../utils/getJwtSecert';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        // define JWT secret dynamically
        const jwtSecret = await getCurrentJwtKey();
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, jwtSecret!);
        (req as any).user = decoded; // Attach decoded user info to req
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};
export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user || !roles.includes(user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        next();
    };
};