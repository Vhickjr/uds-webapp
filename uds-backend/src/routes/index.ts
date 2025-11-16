import { Router } from 'express';
import { authRouter } from './authRoutes.js';
import { inventoryRouter } from './inventoryRoutes.js';
import { borrowRouter } from './borrowRoutes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/borrow', borrowRouter);
