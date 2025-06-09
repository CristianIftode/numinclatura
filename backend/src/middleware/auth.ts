import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Отсутствует токен авторизации' });
    return;
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: number;
      username: string;
    };
    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Недействительный токен' });
    return;
  }
};

export default authenticateToken; 