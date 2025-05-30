import mongoose, { Schema, Document } from 'mongoose';
import User from "./user";

interface IBrand extends Document {
  // No need for _id field in discriminator
  companyName?: string; // Alias: businessName
  businessType?: string;
  website?: string;
  logo?: string; // Cloudinary URL
  avatar?: string;
  bio?: string;
  phoneNumber?: string;
  location?: string;
  onboardingCompleted?: boolean;
  verifiedBrand?: boolean;
}

const BrandSchema = new Schema<IBrand>({
  companyName: { type: String }, // Alias: businessName
  businessType: { type: String},
  website: { type: String },
  logo: { type: String },
  avatar: { type: String },
  bio: { type: String },
  phoneNumber: { type: String },
  location: { type: String },
  onboardingCompleted: { type: Boolean, default: false },
  verifiedBrand: { type: Boolean, default: false },
}, { timestamps: true });

// Create indexes for faster queries
BrandSchema.index({ companyName: 1 });

// Use discriminator pattern like in the Influencer model
const Brand = mongoose.models.Brand || User.discriminator<IBrand>("Brand", BrandSchema);

export { Brand };
