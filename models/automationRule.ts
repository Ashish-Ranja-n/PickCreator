import mongoose, { Schema } from 'mongoose';

const AutomationRuleSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  triggerType: {
    type: String,
    enum: ['keyword', 'all_messages'],
    required: true
  },
  keywords: [String],
  responseTemplate: {
    type: String,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  delaySeconds: {
    type: Number,
    default: 0,
    min: 0,
    max: 30
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const AutomationRule = mongoose.models.AutomationRule || 
  mongoose.model('AutomationRule', AutomationRuleSchema); 