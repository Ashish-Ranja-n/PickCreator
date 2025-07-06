import { models, Schema, Types } from "mongoose";
import User from "./user";
import mongoose from "mongoose";

// Define types for pricing options
interface IFixedPriceOption {
  enabled: boolean;
  storyPrice?: number;
  reelPrice?: number;
  postPrice?: number;
  livePrice?: number;
}

interface IPackageDeal {
  name: string;
  includedServices: string;
  totalPrice: number;
}

interface IBarterDeal {
  enabled: boolean;
  acceptedCategories: string[]; // Categories for barter deals
  restrictions?: string; // Any restrictions for barter deals
}

// Define interface for Instagram analytics data
interface IInstagramAnalytics {
  totalPosts: number;
  averageEngagement: number;
  avgReelViews: number; // Average views on last 30 reels
  avgReelLikes: number; // Average likes on last 30 reels
  lastUpdated: Date;
}

// Main Influencer interface

interface IInfluencer {
  socialMediaLinks?: { platform?: string; url?: string }[];
  followers?: number;
  profilePicture?: string;

  // Personal info fields
  age?: number;
  gender?: 'male' | 'female' | 'other';

  // Instagram-specific fields
  instagramConnected?: boolean;
  instagramToken?: {
    accessToken?: string;
    expiresIn?: number;
    createdAt?: Date;
  };
  instagramUsername?: string;
  instagramId?: string;
  instagramWebhookId?: string; // ID used in Instagram webhooks (recipient.id)
  followerCount?: number;
  profilePictureUrl?: string;
  accountType?: string;
  mediaCount?: number;
  bio?: string;
  // Add a field to track when Instagram data was last updated
  lastInstagramUpdate?: Date;
  // Add complete Instagram analytics data
  instagramAnalytics?: IInstagramAnalytics;

  // Onboarding information
  city?: string;

  // Pricing models
  pricingModels?: {
    fixedPricing?: IFixedPriceOption;
    negotiablePricing?: boolean;
    packageDeals?: {
      enabled?: boolean;
      packages?: IPackageDeal[];
    };
    barterDeals?: IBarterDeal;
  };

  // Brand preferences
  brandPreferences?: {
    preferredBrandTypes?: string[]; // Types of brands they prefer to work with
    exclusions?: string[]; // Brand types they exclude
    collabStyles?: string[]; // Styles of collaboration they prefer
  };

  // Availability
  availability?: string[]; // Days available for collaboration

  // Onboarding status
  onboardingCompleted?: boolean;
  onboardingStep?: number; // Current step in onboarding process

  // Instagram manual verification reference
  instagramVerification?: Types.ObjectId; // Reference to InstagramVerification model

  // Boolean field for verification status
  isInstagramVerified?: boolean; // Manual verification status

  // Earnings tracking
  earnings?: number; // Total accumulated earnings from completed deals

  // UPI payment information
  upiId?: string; // UPI ID for payments
  upiUsername?: string; // UPI username for payments
}

const InfluencerSchema = new Schema<IInfluencer>({
  // Personal info fields
  age: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  // Remove user field - not needed for discriminator
  socialMediaLinks: {
    type: [{
      platform: { type: String, required: false },
      url: { type: String, required: false },
    }],
    default: [] // Set default to empty array
  },
  followers: { type: Number, default: 0 },
  profilePicture: { type: String },

  // Instagram-specific fields
  instagramConnected: { type: Boolean, default: false },
  instagramToken: {
    accessToken: { type: String },
    expiresIn: { type: Number },
    createdAt: { type: Date }
  },
  instagramUsername: { type: String },
  instagramId: { type: String },
  instagramWebhookId: { type: String }, // ID used in Instagram webhooks
  followerCount: { type: Number, default: 0 },
  profilePictureUrl: { type: String },
  accountType: { type: String },
  mediaCount: { type: Number },
  bio: { type: String },
  // Add the lastInstagramUpdate field to the schema
  lastInstagramUpdate: { type: Date },
  // Add Instagram analytics to the schema
  instagramAnalytics: {
    totalPosts: { type: Number },
    averageEngagement: { type: Number },
    avgReelViews: { type: Number },
    avgReelLikes: { type: Number },
    lastUpdated: { type: Date }
  },

  // Onboarding information
  city: { type: String },

  // Pricing models
  pricingModels: {
    fixedPricing: {
      enabled: { type: Boolean, default: false },
      storyPrice: { type: Number },
      reelPrice: { type: Number },
      postPrice: { type: Number },
      livePrice: { type: Number }
    },
    negotiablePricing: { type: Boolean, default: false },
    packageDeals: {
      enabled: { type: Boolean, default: false },
      packages: [{
        name: { type: String },
        includedServices: { type: String },
        totalPrice: { type: Number }
      }]
    },
    barterDeals: {
      enabled: { type: Boolean, default: false },
      acceptedCategories: [{ type: String }],
      restrictions: { type: String }
    }
  },

  // Brand preferences
  brandPreferences: {
    preferredBrandTypes: [{ type: String }],
    exclusions: [{ type: String }],
    collabStyles: [{ type: String }]
  },

  // Availability
  availability: [{ type: String }],

  // Onboarding status
  onboardingCompleted: { type: Boolean, default: false },
  onboardingStep: { type: Number, default: 0 },

  // Instagram manual verification reference
  instagramVerification: {
    type: Schema.Types.ObjectId,
    ref: 'InstagramVerification',
  },

  // Boolean field for verification status
  isInstagramVerified: { type: Boolean, default: false },

  // Earnings tracking
  earnings: { type: Number, default: 0 },

  // UPI payment information
  upiId: { type: String },
  upiUsername: { type: String },
});

// Create a discriminator - an Influencer IS-A User
// Fix to ensure proper model registration with mongoose
const Influencer = mongoose.models.Influencer || User.discriminator<IInfluencer>("Influencer", InfluencerSchema);

export { Influencer };
