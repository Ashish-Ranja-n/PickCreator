import { randomUUID } from 'crypto';
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from 'pg-sdk-node';
import { Payment, PaymentStatus } from '@/models/payment';

// Initialize PhonePe client
let phonepeClient: any = null;

/**
 * Initialize the PhonePe client with credentials
 */
export const initPhonePeClient = () => {
  if (phonepeClient) return phonepeClient;

  const clientId = process.env.PHONEPE_CLIENT_ID;
  const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
  const clientVersion = Number(process.env.PHONEPE_CLIENT_VERSION || '1');
  const env = process.env.PHONEPE_ENVIRONMENT === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

  if (!clientId || !clientSecret) {
    throw new Error('PhonePe credentials not configured');
  }

  try {
    phonepeClient = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);
    return phonepeClient;
  } catch (error) {
    console.error('Failed to initialize PhonePe client:', error);
    throw new Error('Failed to initialize PhonePe client');
  }
};

/**
 * Create a payment request for a deal
 * @param dealId - The deal ID
 * @param brandId - The brand ID
 * @param amount - The payment amount in INR
 * @param redirectUrl - The URL to redirect after payment
 * @returns Payment object with payment URL
 */
export const createPaymentRequest = async (
  dealId: string,
  brandId: string,
  amount: number,
  redirectUrl: string
) => {
  try {
    const client = initPhonePeClient();
    
    // Generate a unique merchant order ID
    const merchantOrderId = `PICK_${randomUUID().replace(/-/g, '').substring(0, 16)}`;
    
    // Convert amount to paise (PhonePe expects amount in paise)
    const amountInPaise = Math.round(amount * 100);
    
    // Create payment request
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(amountInPaise)
      .redirectUrl(redirectUrl)
      .build();
    
    // Send request to PhonePe
    const response = await client.pay(request);
    
    // Create payment record in database
    const payment = await Payment.create({
      dealId,
      brandId,
      merchantOrderId,
      amount,
      status: PaymentStatus.INITIATED,
      paymentUrl: response.redirectUrl,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return payment;
  } catch (error) {
    console.error('Error creating payment request:', error);
    throw new Error('Failed to create payment request');
  }
};

/**
 * Check the status of a payment
 * @param merchantOrderId - The merchant order ID
 * @returns Payment status from PhonePe
 */
export const checkPaymentStatus = async (merchantOrderId: string) => {
  try {
    const client = initPhonePeClient();
    const response = await client.getOrderStatus(merchantOrderId);
    return response;
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw new Error('Failed to check payment status');
  }
};

/**
 * Validate a callback from PhonePe
 * @param username - The configured username
 * @param password - The configured password
 * @param authorization - The authorization header
 * @param responseBody - The callback response body
 * @returns Validated callback data
 */
export const validateCallback = (
  username: string,
  password: string,
  authorization: string,
  responseBody: string
) => {
  try {
    const client = initPhonePeClient();
    const callbackResponse = client.validateCallback(
      username,
      password,
      authorization,
      responseBody
    );
    return callbackResponse;
  } catch (error) {
    console.error('Error validating callback:', error);
    throw new Error('Failed to validate callback');
  }
};

/**
 * Update payment status based on PhonePe callback
 * @param merchantOrderId - The merchant order ID
 * @param status - The new payment status
 * @param callbackData - The callback data from PhonePe
 * @returns Updated payment object
 */
export const updatePaymentStatus = async (
  merchantOrderId: string,
  status: PaymentStatus,
  callbackData: any
) => {
  try {
    const payment = await Payment.findOneAndUpdate(
      { merchantOrderId },
      {
        $set: {
          status,
          callbackResponse: callbackData,
          updatedAt: new Date(),
          ...(callbackData.transactionId && { transactionId: callbackData.transactionId }),
          ...(callbackData.phonepeOrderId && { phonepeOrderId: callbackData.phonepeOrderId })
        }
      },
      { new: true }
    );
    
    return payment;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw new Error('Failed to update payment status');
  }
};
