import { models, Schema, Types, model } from "mongoose";

// Payment status enum
export enum PaymentStatus {
  INITIATED = 'initiated',
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

// Payment interface
export interface IPayment {
  dealId: Types.ObjectId;
  brandId: Types.ObjectId;
  merchantOrderId: string;
  phonepeOrderId?: string;
  transactionId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentUrl?: string;
  paymentMethod?: string;
  paymentDetails?: any;
  callbackResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  dealId: { type: Schema.Types.ObjectId, ref: 'Deal', required: true },
  brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  merchantOrderId: { type: String, required: true, unique: true },
  phonepeOrderId: { type: String },
  transactionId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.INITIATED
  },
  paymentUrl: { type: String },
  paymentMethod: { type: String },
  paymentDetails: { type: Schema.Types.Mixed },
  callbackResponse: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Indexes for faster queries
PaymentSchema.index({ merchantOrderId: 1 });
PaymentSchema.index({ dealId: 1 });
PaymentSchema.index({ brandId: 1 });
PaymentSchema.index({ status: 1 });

export const Payment = models.Payment || model<IPayment>("Payment", PaymentSchema);