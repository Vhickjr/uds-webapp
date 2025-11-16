import mongoose, { Schema, Document, Types } from 'mongoose';

export enum RequestStatus {
  pending = 'pending',
  approved = 'approved',
  rejected = 'rejected',
  returned = 'returned'
}

export interface IUserRequest extends Document {
  user: Types.ObjectId;
  item: Types.ObjectId;
  status: RequestStatus;
  quantity: number;
  dueDate: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  returnedAt?: Date;
}

const UserRequestSchema = new Schema<IUserRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    item: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    status: { type: String, enum: Object.values(RequestStatus), default: RequestStatus.pending, index: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    dueDate: { type: Date, default: () => new Date(Date.now() + 7*24*60*60*1000) },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    returnedAt: { type: Date }
  },
  { timestamps: true }
);

// Unique borrowed combination while active (approved + not returned)
UserRequestSchema.index(
  { user: 1, item: 1 },
  { unique: true, partialFilterExpression: { status: 'approved', returnedAt: { $exists: false } } }
);

export const UserRequest = mongoose.model<IUserRequest>('UserRequest', UserRequestSchema);
