import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { listItems, getItem, createItem, updateItem, deleteItem, lookupByQr } from '../controllers/inventoryController.js';

export const inventoryRouter = Router();

inventoryRouter.get('/', listItems);
inventoryRouter.get('/qr/:code', lookupByQr);
inventoryRouter.get('/:id', getItem);
inventoryRouter.post('/', auth(true), createItem);
inventoryRouter.patch('/:id', auth(true), updateItem);
inventoryRouter.delete('/:id', auth(true), deleteItem);
