import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  post: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, "Comment content is required"],
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Author is required"],
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, "Post reference is required"],
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
  },
  { timestamps: true }
);

// Create indexes for better query performance
CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1 });

const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
