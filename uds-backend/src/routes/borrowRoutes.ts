import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { borrowItem, approveRequest, returnRequest, listMyRequests } from '../controllers/borrowController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const borrowRouter = Router();

borrowRouter.post('/', auth(true), asyncHandler(borrowItem));
borrowRouter.post('/:id/approve', auth(true), asyncHandler(approveRequest)); // admin gate in future
borrowRouter.post('/:id/return', auth(true), asyncHandler(returnRequest));
borrowRouter.get('/mine', auth(true), asyncHandler(listMyRequests));
