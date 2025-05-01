import mongoose, { Schema, Document } from 'mongoose';
import User from "./user";

interface IBrand extends Document {
  // No need for _id field in discriminator
  companyName?: string;
  website?: string;
  logo?: string; // Cloudinary URL
  avatar?: string;
  bio?: string;
  phoneNumber?: string;
  location?: string;
}

const BrandSchema = new Schema<IBrand>({
  companyName: { type: String },
  website: { type: String },
  logo: { type: String },
  avatar: { type: String },
  bio: { type: String },
  phoneNumber: { type: String },
  location: { type: String },
}, { timestamps: true });

// Create indexes for faster queries
BrandSchema.index({ companyName: 1 });

// Use discriminator pattern like in the Influencer model
const Brand = mongoose.models.Brand || User.discriminator<IBrand>("Brand", BrandSchema);

export { Brand };
