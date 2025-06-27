import mongoose, { Schema, Document, models, model } from 'mongoose';


export interface IBugReport extends Document {
  title: string;
  description: string;
  createdAt: Date;
  resolved: boolean;
  userId: string;
}


const BugReportSchema = new Schema<IBugReport>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  userId: { type: String, required: true },
});

export default models.BugReport || model<IBugReport>('BugReport', BugReportSchema);
