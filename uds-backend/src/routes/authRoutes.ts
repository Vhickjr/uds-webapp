import { Router } from 'express';
import { signup, login, me } from '../controllers/authController.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { auth } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/signup', asyncHandler(signup));
authRouter.post('/login', asyncHandler(login));
authRouter.get('/me', auth(true), asyncHandler(me));
