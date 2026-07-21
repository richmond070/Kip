import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './verifyToken';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }

    try {
        const token = authHeader.split(' ')[1];
        // Checks against current key + previous key, so a token issued just
        // before rotation isn't instantly invalidated the moment
        // rotateJwtKey() runs (every 2 days, see rotateJwtKeys.ts).
        const decoded = await verifyToken(token);
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