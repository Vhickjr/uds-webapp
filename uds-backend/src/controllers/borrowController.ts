import { Request, Response } from 'express';
import { UserRequest, RequestStatus } from '../models/UserRequest.js';
import { Item } from '../models/Item.js';
import { ApiError } from '../middleware/errorHandler.js';
import { getPageParams, buildPaginated } from '../utils/pagination.js';

export async function borrowItem(req: Request, res: Response) {
  // @ts-ignore
  const userId = req.user._id;
  const { itemId, quantity = 1 } = req.body;
  const item = await Item.findById(itemId);
  if (!item) throw new ApiError(404, 'Item not found');
  if (item.available < quantity) throw new ApiError(400, 'Insufficient available quantity');

  // create pending request
  const request = await UserRequest.create({ user: userId, item: item._id, quantity });
  res.status(201).json({ success: true, data: request });
}

export async function approveRequest(req: Request, res: Response) {
  const { id } = req.params;
  const request = await UserRequest.findById(id);
  if (!request) throw new ApiError(404, 'Request not found');
  if (request.status !== RequestStatus.pending) throw new ApiError(400, 'Not pending');
  // Adjust item counts
  const item = await Item.findById(request.item);
  if (!item) throw new ApiError(404, 'Item not found');
  if (item.available < request.quantity) throw new ApiError(400, 'Insufficient available quantity');
  item.available -= request.quantity;
  item.inUse += request.quantity;
  await item.save();
  request.status = RequestStatus.approved;
  request.reviewedAt = new Date();
  // @ts-ignore
  request.reviewedBy = req.user._id;
  await request.save();
  res.json({ success: true, data: request });
}

export async function returnRequest(req: Request, res: Response) {
  const { id } = req.params;
  const request = await UserRequest.findById(id);
  if (!request) throw new ApiError(404, 'Request not found');
  if (request.status !== RequestStatus.approved || request.returnedAt) throw new ApiError(400, 'Not active');
  const item = await Item.findById(request.item);
  if (!item) throw new ApiError(404, 'Item not found');
  item.inUse -= request.quantity;
  item.available += request.quantity;
  await item.save();
  request.status = RequestStatus.returned;
  request.returnedAt = new Date();
  await request.save();
  res.json({ success: true, data: request });
}

export async function listMyRequests(req: Request, res: Response) {
  // @ts-ignore
  const userId = req.user._id;
  const { page, limit, skip } = getPageParams(req);
  const filter: any = { user: userId };
  const [requests, total] = await Promise.all([
    UserRequest.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('item'),
    UserRequest.countDocuments(filter)
  ]);
  res.json({ success: true, data: buildPaginated(requests, total, page, limit) });
}
