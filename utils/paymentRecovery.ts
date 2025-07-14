import axios from 'axios';

export interface PaymentVerificationResult {
  success: boolean;
  status: 'success' | 'failed' | 'cancelled' | 'pending' | 'error';
  message: string;
  dealId?: string;
  merchantOrderId?: string;
  method?: string;
  error?: string;
}

export interface PaymentRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  enableFallbacks?: boolean;
  timeoutMs?: number;
}

/**
 * Comprehensive payment verification with multiple fallback methods
 */
export class PaymentRecoveryService {
  private static instance: PaymentRecoveryService;
  private readonly defaultOptions: PaymentRecoveryOptions = {
    maxRetries: 3,
    retryDelay: 2000,
    enableFallbacks: true,
    timeoutMs: 30000
  };

  static getInstance(): PaymentRecoveryService {
    if (!PaymentRecoveryService.instance) {
      PaymentRecoveryService.instance = new PaymentRecoveryService();
    }
    return PaymentRecoveryService.instance;
  }

  /**
   * Verify payment with comprehensive error recovery
   */
  async verifyPaymentWithRecovery(
    merchantOrderId?: string | null,
    transactionId?: string | null,
    dealId?: string | null,
    options: PaymentRecoveryOptions = {}
  ): Promise<PaymentVerificationResult> {
    const opts = { ...this.defaultOptions, ...options };

    console.log(`[PaymentRecovery] Starting verification with merchantOrderId: ${merchantOrderId}, transactionId: ${transactionId}, dealId: ${dealId}`);

    // Method 1: Primary verification using merchant order ID
    if (merchantOrderId) {
      const result = await this.tryVerificationMethod(
        'merchant-order',
        () => this.verifyByMerchantOrderId(merchantOrderId),
        opts
      );
      if (result.success) {
        return result;
      }
    }

    // Method 2: Fallback to transaction ID verification
    if (transactionId && opts.enableFallbacks) {
      const result = await this.tryVerificationMethod(
        'transaction-id',
        () => this.verifyByTransactionId(transactionId, dealId),
        opts
      );
      if (result.success) return result;
    }

    // Method 3: Final fallback to deal status check
    if (dealId && opts.enableFallbacks) {
      const result = await this.tryVerificationMethod(
        'deal-status',
        () => this.verifyByDealStatus(dealId),
        opts
      );
      if (result.success) return result;
    }

    // Method 4: Last resort - database direct check
    if (dealId && opts.enableFallbacks) {
      const result = await this.tryVerificationMethod(
        'database-direct',
        () => this.verifyByDatabaseDirect(dealId),
        opts
      );
      if (result.success) return result;
    }

    return {
      success: false,
      status: 'error',
      message: 'All verification methods failed. Please contact support.',
      error: 'VERIFICATION_FAILED'
    };
  }

  /**
   * Try a verification method with retries and error handling
   */
  private async tryVerificationMethod(
    methodName: string,
    verificationFn: () => Promise<PaymentVerificationResult>,
    options: PaymentRecoveryOptions
  ): Promise<PaymentVerificationResult> {
    const maxRetries = options.maxRetries || 3;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        console.log(`[PaymentRecovery] Trying ${methodName} (attempt ${attempt + 1}/${maxRetries})`);

        // Track verification attempt (removed for client-side compatibility)

        const result = await Promise.race([
          verificationFn(),
          this.createTimeoutPromise(options.timeoutMs || 30000)
        ]);

        if (result.success) {
          console.log(`[PaymentRecovery] ${methodName} succeeded on attempt ${attempt + 1}`);

          // Track verification success (removed for client-side compatibility)

          return { ...result, method: methodName };
        }

        // If not successful but not an error, don't retry
        if (result.status !== 'error') {
          console.log(`[PaymentRecovery] ${methodName} returned non-error status: ${result.status}`);
          return { ...result, method: methodName };
        }

      } catch (error: any) {
        console.error(`[PaymentRecovery] ${methodName} attempt ${attempt + 1} failed:`, error);
        
        // If this is the last attempt, return the error
        if (attempt === maxRetries - 1) {
          return {
            success: false,
            status: 'error',
            message: `${methodName} failed after ${maxRetries} attempts`,
            method: methodName,
            error: error.message
          };
        }

        // Wait before retrying (exponential backoff)
        const delay = (options.retryDelay || 2000) * Math.pow(1.5, attempt);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      status: 'error',
      message: `${methodName} failed after ${maxRetries} attempts`,
      method: methodName
    };
  }

  /**
   * Verify payment using merchant order ID
   */
  private async verifyByMerchantOrderId(merchantOrderId: string): Promise<PaymentVerificationResult> {
    try {
      const response = await axios.get(`/api/payments/status/${merchantOrderId}`);
      
      if (response.data.success) {
        const payment = response.data.payment;
        return {
          success: true,
          status: payment.status,
          message: `Payment verification successful via merchant order ID`,
          merchantOrderId: payment.merchantOrderId
        };
      } else {
        return {
          success: false,
          status: 'error',
          message: response.data.error || 'Failed to verify payment via merchant order ID'
        };
      }
    } catch (error: any) {
      throw new Error(`Merchant order verification failed: ${error.message}`);
    }
  }

  /**
   * Verify payment using transaction ID
   */
  private async verifyByTransactionId(transactionId: string, dealId?: string | null): Promise<PaymentVerificationResult> {
    try {
      const response = await axios.post('/api/payments/verify-by-transaction', {
        transactionId,
        dealId
      });
      
      if (response.data.success) {
        const payment = response.data.payment;
        return {
          success: true,
          status: payment.status,
          message: `Payment verification successful via transaction ID`,
          merchantOrderId: payment.merchantOrderId
        };
      } else {
        return {
          success: false,
          status: 'error',
          message: response.data.error || 'Failed to verify payment via transaction ID'
        };
      }
    } catch (error: any) {
      throw new Error(`Transaction ID verification failed: ${error.message}`);
    }
  }

  /**
   * Verify payment by checking deal status
   */
  private async verifyByDealStatus(dealId: string): Promise<PaymentVerificationResult> {
    try {
      const response = await axios.get(`/api/deals/${dealId}`);
      
      if (response.data.success && response.data.deal) {
        const deal = response.data.deal;
        
        if (deal.paymentStatus === 'paid' || deal.status === 'ongoing') {
          return {
            success: true,
            status: 'success',
            message: 'Payment confirmed via deal status check',
            dealId: deal._id
          };
        } else {
          return {
            success: false,
            status: 'pending',
            message: 'Deal payment status indicates payment is still pending'
          };
        }
      } else {
        return {
          success: false,
          status: 'error',
          message: 'Failed to retrieve deal information'
        };
      }
    } catch (error: any) {
      throw new Error(`Deal status verification failed: ${error.message}`);
    }
  }

  /**
   * Direct database check as last resort
   */
  private async verifyByDatabaseDirect(dealId: string): Promise<PaymentVerificationResult> {
    try {
      // This would need to be called from a server-side context
      // For now, we'll simulate this by making an API call
      const response = await axios.post('/api/payments/verify-database-direct', {
        dealId
      });
      
      if (response.data.success) {
        return {
          success: true,
          status: response.data.status,
          message: 'Payment verified via direct database check',
          dealId
        };
      } else {
        return {
          success: false,
          status: 'error',
          message: 'Direct database verification failed'
        };
      }
    } catch (error: any) {
      throw new Error(`Database direct verification failed: ${error.message}`);
    }
  }

  /**
   * Create a timeout promise
   */
  private createTimeoutPromise(timeoutMs: number): Promise<PaymentVerificationResult> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Verification timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const paymentRecovery = PaymentRecoveryService.getInstance();
