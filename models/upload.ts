import mongoose, { Schema, Document } from "mongoose";

// Define the upload types
export enum UploadType {
  PROFILE_PICTURE = 'profile_picture',
  CHAT_MEDIA = 'chat_media',
  INSTAGRAM_MEDIA = 'instagram_media',
}

// Define the media types
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  OTHER = 'other',
}

// Interface for the Upload document
export interface IUpload extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  cloudinaryPublicId: string;
  cloudinaryUrl: string;
  resourceType: string;
  originalFilename?: string;
  originalUrl?: string;
  fileSize?: number;
  mediaType: MediaType;
  uploadType: UploadType;
  metadata?: Record<string, any>;
  instagramId?: string;
  messageId?: mongoose.Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for the Upload model
const UploadSchema = new Schema<IUpload>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    resourceType: { type: String, required: true },
    originalFilename: { type: String },
    originalUrl: { type: String },
    fileSize: { type: Number },
    mediaType: { 
      type: String, 
      enum: Object.values(MediaType),
      required: true 
    },
    uploadType: { 
      type: String, 
      enum: Object.values(UploadType),
      required: true 
    },
    metadata: { type: Schema.Types.Mixed },
    instagramId: { type: String },
    messageId: { type: Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

// Create indexes for faster queries
UploadSchema.index({ userId: 1 });
UploadSchema.index({ uploadType: 1 });
UploadSchema.index({ instagramId: 1 });
UploadSchema.index({ messageId: 1 });

// Create the Upload model
const Upload = mongoose.models.Upload || mongoose.model<IUpload>('Upload', UploadSchema);

export default Upload;
