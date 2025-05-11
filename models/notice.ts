import mongoose, { Document, Schema } from 'mongoose';

export interface INotice extends Document {
  title: string;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Notice content is required"],
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Creator is required"],
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Add indexes for better query performance
NoticeSchema.index({ createdAt: -1 });
NoticeSchema.index({ isPinned: -1, createdAt: -1 });

const Notice = mongoose.models.Notice || mongoose.model<INotice>('Notice', NoticeSchema);
export default Notice;
