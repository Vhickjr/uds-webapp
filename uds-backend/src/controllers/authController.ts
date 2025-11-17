import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../middleware/errorHandler.js';

function sign(user: any) {
  // Ensure proper typing for secret and expiresIn to satisfy jsonwebtoken overloads
  const secret: jwt.Secret = env.JWT_SECRET as unknown as jwt.Secret;
  const expiresIn = env.JWT_EXPIRES_IN as unknown as jwt.SignOptions['expiresIn'];
  const options: jwt.SignOptions = { expiresIn };
  return jwt.sign({ id: user._id }, secret, options);
}

export async function signup(req: Request, res: Response) {
  const { firstName, lastName, email, phone, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'Email already registered');
  const user = await User.create({ firstName, lastName, email, phone, password });
  res.status(201).json({ success: true, data: { user: user.toJSON(), token: sign(user) } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid credentials');
  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Invalid credentials');
  res.json({ success: true, data: { user: user.toJSON(), token: sign(user) } });
}

export async function me(req: Request, res: Response) {
  // user injected by auth middleware
  // @ts-ignore
  res.json({ success: true, data: { user: req.user?.toJSON() } });
}
