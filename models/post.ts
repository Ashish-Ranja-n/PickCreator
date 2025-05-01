import mongoose from 'mongoose';

const PostSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Please provide post content"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, "Please provide author ID"],
    },
    media: [
      {
        type: String,
        default: [],
      },
    ],
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    // Comments are now stored in a separate collection
    // This field is kept for backward compatibility
    comments: {
      type: Array,
      default: [],
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    reposts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ],
    hashtags: [
      {
        type: String,
        default: [],
      },
    ],
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: [],
      },
    ]
  },
  {
    timestamps: true,
  }
);

// Indexing for better query performance
PostSchema.index({ author: 1 });
PostSchema.index({ createdAt: -1 });

const Post = mongoose.models.Post || mongoose.model('Post', PostSchema);

export default Post;