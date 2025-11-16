import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { borrowItem, approveRequest, returnRequest, listMyRequests } from '../controllers/borrowController.js';

export const borrowRouter = Router();

borrowRouter.post('/', auth(true), borrowItem);
borrowRouter.post('/:id/approve', auth(true), approveRequest); // admin gate in future
borrowRouter.post('/:id/return', auth(true), returnRequest);
borrowRouter.get('/mine', auth(true), listMyRequests);
