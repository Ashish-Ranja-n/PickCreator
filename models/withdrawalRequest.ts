import mongoose, { Schema, Document } from 'mongoose';

export interface IWithdrawalRequest extends Document {
  influencerId: mongoose.Types.ObjectId;
  amount: number;
  upiId: string;
  upiUsername: string;
  status: 'pending' | 'completed';
  requestedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    influencerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Influencer ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Minimum withdrawal amount is ₹1'],
    },
    upiId: {
      type: String,
      required: [true, 'UPI ID is required'],
      trim: true,
    },
    upiUsername: {
      type: String,
      required: [true, 'UPI username is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
WithdrawalRequestSchema.index({ influencerId: 1 });
WithdrawalRequestSchema.index({ status: 1 });
WithdrawalRequestSchema.index({ requestedAt: -1 });
WithdrawalRequestSchema.index({ influencerId: 1, status: 1 });

// Virtual to populate influencer details
WithdrawalRequestSchema.virtual('influencer', {
  ref: 'User',
  localField: 'influencerId',
  foreignField: '_id',
  justOne: true,
});

// Ensure virtual fields are serialized
WithdrawalRequestSchema.set('toJSON', { virtuals: true });
WithdrawalRequestSchema.set('toObject', { virtuals: true });

// Pre-save middleware to set completedAt when status changes to completed
WithdrawalRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

const WithdrawalRequest = mongoose.models.WithdrawalRequest || mongoose.model<IWithdrawalRequest>('WithdrawalRequest', WithdrawalRequestSchema);

export default WithdrawalRequest;
