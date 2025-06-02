import { models, Schema, Types, model } from "mongoose";

// Content requirements interface
interface IContentRequirements {
  reels: number;
  posts: number;
  stories: number;
  lives: number;
}

// Package interface
interface IPackage {
  name: string;
  includedServices: string;
  totalPrice: number;
}

// Content submission interface
interface IContentSubmission {
  type: 'reel' | 'post' | 'story' | 'live';
  url: string;
  submittedBy: string; // influencer ID
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string; // For rejection comments
  reviewedAt?: Date;
}

// Influencer in a deal
interface IDealInfluencer {
  id: string;
  name: string;
  profilePictureUrl: string;
  offeredPrice: number;
  status: 'pending' | 'accepted' | 'rejected';
  counterOffer: number | null;
}

// Main Deal interface
interface IDeal {
  brandId: Types.ObjectId;
  brandName: string;
  brandProfilePic: string;
  companyName?: string;
  location?: string;
  dealType: 'single' | 'multiple';
  dealName: string;
  description: string;
  budget: number;
  influencers: IDealInfluencer[];
  contentRequirements: IContentRequirements;
  usePackageDeals: boolean;
  selectedPackage?: IPackage | null;
  visitRequired: boolean;
  isNegotiating: boolean;
  offerAmount: number;
  isProductExchange: boolean;
  productName: string;
  productPrice: number;
  status: 'requested' | 'counter-offered' | 'accepted' | 'ongoing' | 'completed' | 'cancelled' | 'content_approved';
  paymentStatus: 'paid' | 'unpaid';
  createdAt: Date;
  totalAmount: number;
  submittedContent?: IContentSubmission[];
  contentPublished: boolean;
  paymentReleased: boolean;
}

const DealSchema = new Schema<IDeal>({
  brandId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  brandName: { type: String, required: true },
  brandProfilePic: { type: String },
  companyName: { type: String },
  location: { type: String },
  dealType: { type: String, enum: ['single', 'multiple'], required: true },
  dealName: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  influencers: [{
    id: { type: String, required: true },
    name: { type: String, required: true },
    profilePictureUrl: { type: String },
    offeredPrice: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    counterOffer: { type: Number, default: null }
  }],
  contentRequirements: {
    reels: { type: Number, default: 0 },
    posts: { type: Number, default: 0 },
    stories: { type: Number, default: 0 },
    lives: { type: Number, default: 0 }
  },
  usePackageDeals: { type: Boolean, default: false },
  selectedPackage: {
    name: { type: String },
    includedServices: { type: String },
    totalPrice: { type: Number }
  },
  visitRequired: { type: Boolean, default: false },
  isNegotiating: { type: Boolean, default: false },
  offerAmount: { type: Number, default: 0 },
  isProductExchange: { type: Boolean, default: false },
  productName: { type: String },
  productPrice: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['requested', 'counter-offered', 'accepted', 'ongoing', 'completed', 'cancelled', 'content_approved'],
    default: "requested"
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'unpaid'],
    default: "unpaid"
  },
  createdAt: { type: Date, default: Date.now },
  totalAmount: { type: Number, required: true },
  submittedContent: [{
    type: { type: String, enum: ['reel', 'post', 'story', 'live'], required: true },
    url: { type: String, required: true },
    submittedBy: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: { type: String },
    reviewedAt: { type: Date }
  }],
  contentPublished: { type: Boolean, default: false },
  paymentReleased: { type: Boolean, default: false }
});

export const Deal = models.Deal || model<IDeal>("Deal", DealSchema);