import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for contact document
export interface IContact extends Document {
  name: string;
  email: string;
  subject: string;
  message: string;
  userType: 'brand' | 'influencer' | 'agency' | 'other';
  status: 'new' | 'in-progress' | 'resolved';
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
  response?: string;
  responseDate?: Date;
  respondedBy?: string;
  isPublicFaq: boolean;
  faqOrder?: number;
  updateStatus: (status: string, assignedTo?: string, notes?: string) => Promise<IContact>;
  addResponse: (response: string, respondedBy: string, isPublicFaq?: boolean) => Promise<IContact>;
}

// Define the schema
const ContactSchema = new Schema<IContact>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    userType: {
      type: String,
      enum: ['brand', 'influencer', 'agency', 'other'],
      required: [true, 'User type is required'],
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved'],
      default: 'new',
    },
    assignedTo: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
    response: {
      type: String,
      default: null,
    },
    responseDate: {
      type: Date,
      default: null,
    },
    respondedBy: {
      type: String,
      default: null,
    },
    isPublicFaq: {
      type: Boolean,
      default: false,
    },
    faqOrder: {
      type: Number,
      default: null,
    }
  }
);

// Add method to update the status
ContactSchema.methods.updateStatus = function(
  status: string,
  assignedTo?: string,
  notes?: string
): Promise<IContact> {
  this.status = status;
  if (assignedTo) this.assignedTo = assignedTo;
  if (notes) this.notes = notes;
  this.updatedAt = Date.now();
  return this.save();
};

// Add method to add a response
ContactSchema.methods.addResponse = function(
  response: string,
  respondedBy: string,
  isPublicFaq: boolean = false
): Promise<IContact> {
  this.response = response;
  this.respondedBy = respondedBy;
  this.responseDate = new Date();
  this.status = 'resolved';
  this.isPublicFaq = isPublicFaq;
  this.updatedAt = Date.now();
  return this.save();
};

// Use existing model or create a new one
export default mongoose.models.Contact || 
  mongoose.model<IContact>('Contact', ContactSchema); 