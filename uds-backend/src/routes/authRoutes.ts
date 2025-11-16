import { Router } from 'express';
import { signup, login, me } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/signup', signup);
authRouter.post('/login', login);
authRouter.get('/me', auth(true), me);
