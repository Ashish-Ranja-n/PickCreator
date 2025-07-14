import { connect } from '@/lib/mongoose';
import mongoose from 'mongoose';

// Analytics event types
export enum PaymentEventType {
  PAYMENT_INITIATED = 'payment_initiated',
  PAYMENT_CALLBACK_RECEIVED = 'payment_callback_received',
  VERIFICATION_STARTED = 'verification_started',
  VERIFICATION_METHOD_TRIED = 'verification_method_tried',
  VERIFICATION_SUCCESS = 'verification_success',
  VERIFICATION_FAILED = 'verification_failed',
  DEAL_STATUS_UPDATED = 'deal_status_updated',
  USER_REDIRECTED = 'user_redirected',
  ERROR_OCCURRED = 'error_occurred',
  RETRY_ATTEMPTED = 'retry_attempted'
}

// Analytics data interface
export interface PaymentAnalyticsEvent {
  eventType: PaymentEventType;
  dealId?: string;
  merchantOrderId?: string;
  transactionId?: string;
  userId?: string;
  userRole?: string;
  method?: string;
  attempt?: number;
  success?: boolean;
  errorCode?: string;
  errorMessage?: string;
  duration?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

// MongoDB schema for analytics
const PaymentAnalyticsSchema = new mongoose.Schema({
  eventType: { type: String, required: true, enum: Object.values(PaymentEventType) },
  dealId: { type: String },
  merchantOrderId: { type: String },
  transactionId: { type: String },
  userId: { type: String },
  userRole: { type: String },
  method: { type: String },
  attempt: { type: Number },
  success: { type: Boolean },
  errorCode: { type: String },
  errorMessage: { type: String },
  duration: { type: Number },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  sessionId: { type: String },
  userAgent: { type: String },
  ipAddress: { type: String }
}, {
  collection: 'payment_analytics',
  timestamps: true
});

// Add indexes for better query performance (only if model doesn't exist)
if (!mongoose.models.PaymentAnalytics) {
  PaymentAnalyticsSchema.index({ eventType: 1, timestamp: -1 });
  PaymentAnalyticsSchema.index({ dealId: 1, timestamp: -1 });
  PaymentAnalyticsSchema.index({ merchantOrderId: 1, timestamp: -1 }, { sparse: true });
  PaymentAnalyticsSchema.index({ userId: 1, timestamp: -1 });
  PaymentAnalyticsSchema.index({ timestamp: -1 });
}

const PaymentAnalytics = mongoose.models.PaymentAnalytics || mongoose.model('PaymentAnalytics', PaymentAnalyticsSchema);

/**
 * Payment Analytics Service
 */
export class PaymentAnalyticsService {
  private static instance: PaymentAnalyticsService;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  static getInstance(): PaymentAnalyticsService {
    if (!PaymentAnalyticsService.instance) {
      PaymentAnalyticsService.instance = new PaymentAnalyticsService();
    }
    return PaymentAnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Track a payment analytics event
   */
  async trackEvent(event: Omit<PaymentAnalyticsEvent, 'timestamp' | 'sessionId'>): Promise<void> {
    try {
      await connect();

      const analyticsEvent = new PaymentAnalytics({
        ...event,
        sessionId: this.sessionId,
        timestamp: new Date()
      });

      await analyticsEvent.save();
      
      // Also log to console for immediate debugging
      console.log(`[PaymentAnalytics] ${event.eventType}:`, {
        dealId: event.dealId,
        merchantOrderId: event.merchantOrderId,
        method: event.method,
        success: event.success,
        attempt: event.attempt,
        duration: event.duration
      });

    } catch (error) {
      console.error('[PaymentAnalytics] Failed to track event:', error);
      // Don't throw error - analytics should not break the main flow
    }
  }

  /**
   * Track payment initiation
   */
  async trackPaymentInitiated(dealId: string, userId: string, userRole: string, amount: number): Promise<void> {
    await this.trackEvent({
      eventType: PaymentEventType.PAYMENT_INITIATED,
      dealId,
      userId,
      userRole,
      success: true,
      metadata: { amount }
    });
  }

  /**
   * Track verification attempt
   */
  async trackVerificationAttempt(
    method: string,
    attempt: number,
    dealId?: string,
    merchantOrderId?: string,
    transactionId?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: PaymentEventType.VERIFICATION_METHOD_TRIED,
      dealId,
      merchantOrderId,
      transactionId,
      method,
      attempt
    });
  }

  /**
   * Track verification success
   */
  async trackVerificationSuccess(
    method: string,
    duration: number,
    dealId?: string,
    merchantOrderId?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: PaymentEventType.VERIFICATION_SUCCESS,
      dealId,
      merchantOrderId,
      method,
      success: true,
      duration
    });
  }

  /**
   * Track verification failure
   */
  async trackVerificationFailure(
    method: string,
    errorCode: string,
    errorMessage: string,
    duration: number,
    dealId?: string,
    merchantOrderId?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: PaymentEventType.VERIFICATION_FAILED,
      dealId,
      merchantOrderId,
      method,
      success: false,
      errorCode,
      errorMessage,
      duration
    });
  }

  /**
   * Track deal status update
   */
  async trackDealStatusUpdate(
    dealId: string,
    fromStatus: string,
    toStatus: string,
    merchantOrderId?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: PaymentEventType.DEAL_STATUS_UPDATED,
      dealId,
      merchantOrderId,
      success: true,
      metadata: { fromStatus, toStatus }
    });
  }

  /**
   * Track user redirect
   */
  async trackUserRedirect(
    destination: string,
    dealId?: string,
    merchantOrderId?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: PaymentEventType.USER_REDIRECTED,
      dealId,
      merchantOrderId,
      success: true,
      metadata: { destination }
    });
  }

  /**
   * Track error occurrence
   */
  async trackError(
    errorCode: string,
    errorMessage: string,
    method?: string,
    dealId?: string,
    merchantOrderId?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: PaymentEventType.ERROR_OCCURRED,
      dealId,
      merchantOrderId,
      method,
      success: false,
      errorCode,
      errorMessage
    });
  }

  /**
   * Track retry attempt
   */
  async trackRetryAttempt(
    attempt: number,
    method: string,
    dealId?: string,
    merchantOrderId?: string
  ): Promise<void> {
    await this.trackEvent({
      eventType: PaymentEventType.RETRY_ATTEMPTED,
      dealId,
      merchantOrderId,
      method,
      attempt
    });
  }

  /**
   * Get analytics summary for a specific deal
   */
  async getDealAnalytics(dealId: string): Promise<any> {
    try {
      await connect();

      const events = await PaymentAnalytics.find({ dealId }).sort({ timestamp: 1 });
      
      const summary = {
        totalEvents: events.length,
        verificationAttempts: events.filter(e => e.eventType === PaymentEventType.VERIFICATION_METHOD_TRIED).length,
        successfulVerifications: events.filter(e => e.eventType === PaymentEventType.VERIFICATION_SUCCESS).length,
        failedVerifications: events.filter(e => e.eventType === PaymentEventType.VERIFICATION_FAILED).length,
        errors: events.filter(e => e.eventType === PaymentEventType.ERROR_OCCURRED).length,
        retries: events.filter(e => e.eventType === PaymentEventType.RETRY_ATTEMPTED).length,
        timeline: events.map(e => ({
          timestamp: e.timestamp,
          eventType: e.eventType,
          method: e.method,
          success: e.success,
          duration: e.duration
        }))
      };

      return summary;
    } catch (error) {
      console.error('[PaymentAnalytics] Failed to get deal analytics:', error);
      return null;
    }
  }

  /**
   * Get overall payment flow analytics
   */
  async getOverallAnalytics(days: number = 7): Promise<any> {
    try {
      await connect();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await PaymentAnalytics.find({
        timestamp: { $gte: startDate }
      }).sort({ timestamp: -1 });

      const summary = {
        totalPayments: events.filter(e => e.eventType === PaymentEventType.PAYMENT_INITIATED).length,
        successfulVerifications: events.filter(e => e.eventType === PaymentEventType.VERIFICATION_SUCCESS).length,
        failedVerifications: events.filter(e => e.eventType === PaymentEventType.VERIFICATION_FAILED).length,
        totalErrors: events.filter(e => e.eventType === PaymentEventType.ERROR_OCCURRED).length,
        averageVerificationAttempts: this.calculateAverageAttempts(events),
        methodSuccessRates: this.calculateMethodSuccessRates(events),
        commonErrors: this.getCommonErrors(events)
      };

      return summary;
    } catch (error) {
      console.error('[PaymentAnalytics] Failed to get overall analytics:', error);
      return null;
    }
  }

  private calculateAverageAttempts(events: any[]): number {
    const verificationEvents = events.filter(e => e.eventType === PaymentEventType.VERIFICATION_METHOD_TRIED);
    const dealAttempts = new Map<string, number>();

    verificationEvents.forEach(event => {
      const key = event.dealId || event.merchantOrderId || 'unknown';
      dealAttempts.set(key, Math.max(dealAttempts.get(key) || 0, event.attempt || 1));
    });

    const attempts = Array.from(dealAttempts.values());
    return attempts.length > 0 ? attempts.reduce((a, b) => a + b, 0) / attempts.length : 0;
  }

  private calculateMethodSuccessRates(events: any[]): Record<string, { attempts: number; successes: number; rate: number }> {
    const methodStats = new Map<string, { attempts: number; successes: number }>();

    events.forEach(event => {
      if (event.eventType === PaymentEventType.VERIFICATION_METHOD_TRIED && event.method) {
        const stats = methodStats.get(event.method) || { attempts: 0, successes: 0 };
        stats.attempts++;
        methodStats.set(event.method, stats);
      }
      
      if (event.eventType === PaymentEventType.VERIFICATION_SUCCESS && event.method) {
        const stats = methodStats.get(event.method) || { attempts: 0, successes: 0 };
        stats.successes++;
        methodStats.set(event.method, stats);
      }
    });

    const result: Record<string, { attempts: number; successes: number; rate: number }> = {};
    methodStats.forEach((stats, method) => {
      result[method] = {
        ...stats,
        rate: stats.attempts > 0 ? (stats.successes / stats.attempts) * 100 : 0
      };
    });

    return result;
  }

  private getCommonErrors(events: any[]): Array<{ error: string; count: number }> {
    const errorCounts = new Map<string, number>();

    events.filter(e => e.eventType === PaymentEventType.ERROR_OCCURRED).forEach(event => {
      const error = event.errorCode || event.errorMessage || 'Unknown error';
      errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
    });

    return Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

export const paymentAnalytics = PaymentAnalyticsService.getInstance();
