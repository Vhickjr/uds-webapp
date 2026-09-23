import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { listItems, getItem, createItem, updateItem, deleteItem, lookupByQr } from '../controllers/inventoryController.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const inventoryRouter = Router();

inventoryRouter.get('/', asyncHandler(listItems));
inventoryRouter.get('/qr/:code', asyncHandler(lookupByQr));
inventoryRouter.get('/:id', asyncHandler(getItem));
inventoryRouter.post('/', auth(true), asyncHandler(createItem));
inventoryRouter.patch('/:id', auth(true), asyncHandler(updateItem));
inventoryRouter.delete('/:id', auth(true), asyncHandler(deleteItem));
