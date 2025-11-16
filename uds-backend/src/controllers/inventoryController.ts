import { Request, Response } from 'express';
import { Item } from '../models/Item.js';
import { getPageParams, buildPaginated } from '../utils/pagination.js';
import { ApiError } from '../middleware/errorHandler.js';

export async function listItems(req: Request, res: Response) {
  const { page, limit, skip } = getPageParams(req);
  const [items, total] = await Promise.all([
    Item.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Item.countDocuments()
  ]);
  res.json({ success: true, data: buildPaginated(items, total, page, limit) });
}

export async function getItem(req: Request, res: Response) {
  const item = await Item.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Item not found');
  res.json({ success: true, data: item });
}

export async function createItem(req: Request, res: Response) {
  const item = await Item.create(req.body);
  res.status(201).json({ success: true, data: item });
}

export async function updateItem(req: Request, res: Response) {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) throw new ApiError(404, 'Item not found');
  res.json({ success: true, data: item });
}

export async function deleteItem(req: Request, res: Response) {
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) throw new ApiError(404, 'Item not found');
  res.json({ success: true, data: { id: item._id } });
}

export async function lookupByQr(req: Request, res: Response) {
  const item = await Item.findOne({ qrCode: req.params.code });
  if (!item) throw new ApiError(404, 'Item not found');
  res.json({ success: true, data: item });
}
