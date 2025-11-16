import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  name: string;
  description: string;
  assignedRole: string; // limiting to roles; reuse UserRole if desired
  total: number;
  available: number;
  damaged: number;
  inUse: number;
  qrCode?: string; // optionally attach QR code identifier
}

const ItemSchema = new Schema<IItem>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    assignedRole: { type: String, required: true, default: 'admin' },
    total: { type: Number, required: true, default: 0 },
    available: { type: Number, required: true, default: 0 },
    damaged: { type: Number, required: true, default: 0 },
    inUse: { type: Number, required: true, default: 0 },
    qrCode: { type: String, required: false, unique: true, sparse: true }
  },
  { timestamps: true }
);

// Simple validation analog to SQL CHECK: ensure totals match
ItemSchema.pre('save', function(next) {
  if (this.total !== this.available + this.damaged + this.inUse) {
    return next(new Error('Invalid quantities: total != available + damaged + inUse'));
  }
  next();
});

export const Item = mongoose.model<IItem>('Item', ItemSchema);
