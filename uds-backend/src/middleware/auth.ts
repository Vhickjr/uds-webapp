import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: any;
}

export function auth(required = true) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) {
      if (required) return res.status(401).json({ success: false, message: 'Missing Authorization header' });
      return next();
    }
    const token = header.replace('Bearer ', '');
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
      const user = await User.findById(decoded.id);
      if (!user) return res.status(401).json({ success: false, message: 'Invalid token user' });
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }
  };
}
