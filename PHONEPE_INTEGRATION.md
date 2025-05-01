# PhonePe Payment Integration

This document provides instructions for setting up and configuring the PhonePe payment integration in the PickCreator application.

## Installation

1. Install the PhonePe Node.js SDK:

```bash
npm i https://phonepe.mycloudrepo.io/public/repositories/phonepe-pg-sdk-node/releases/v2/phonepe-pg-sdk-node.tgz
```

## Environment Variables

Add the following environment variables to your `.env.local` file:

```
# PhonePe Credentials
PHONEPE_CLIENT_ID=your_client_id
PHONEPE_CLIENT_SECRET=your_client_secret
PHONEPE_CLIENT_VERSION=1
PHONEPE_ENVIRONMENT=SANDBOX  # Change to PRODUCTION when going live

# PhonePe Callback Credentials
PHONEPE_CALLBACK_USERNAME=your_callback_username
PHONEPE_CALLBACK_PASSWORD=your_callback_password

# Application URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL when going live
```

## Configuration

The PhonePe integration consists of the following components:

1. **Payment Model**: Stores payment transaction details
2. **PhonePe Service**: Handles PhonePe API interactions
3. **Payment API Endpoints**: Handles payment initiation, callbacks, and status checks
4. **Payment UI Components**: Displays payment summary and handles user interactions

## Usage

### Making a Payment

1. When a brand clicks the "Make Payment" button on a deal, a payment summary dialog is displayed
2. The dialog shows the deal details and total amount
3. When the brand clicks "Proceed to Payment", they are redirected to the PhonePe payment page
4. After completing the payment, they are redirected back to the application

### Payment Status

1. The payment status is checked automatically when the user is redirected back
2. If the payment is successful, the deal is moved to the "Ongoing" tab
3. If the payment fails, the user is notified and can try again

## Webhook Configuration

For production, you need to configure a webhook in the PhonePe dashboard to receive payment status updates:

1. Log in to your PhonePe Business account
2. Go to the Developer section
3. Configure a webhook URL: `https://your-domain.com/api/payments/callback`
4. Set up the webhook credentials (username and password)
5. Add these credentials to your environment variables

## Testing

For testing in the sandbox environment:

1. Use the test credentials provided by PhonePe
2. Test cards:
   - Success: 4242 4242 4242 4242
   - Failure: 4111 1111 1111 1111
3. Use any future expiry date and any 3-digit CVV

## Troubleshooting

Common issues:

1. **Payment Initiation Fails**: Check your PhonePe credentials and ensure they are correctly set in the environment variables
2. **Callback Not Received**: Verify your webhook URL is accessible and the credentials are correct
3. **Redirect Issues**: Ensure the `NEXT_PUBLIC_APP_URL` is correctly set

## Support

For PhonePe integration support, contact:
- PhonePe Developer Support: [developer.phonepe.com](https://developer.phonepe.com)
- PhonePe Business Support: [business.phonepe.com/support](https://business.phonepe.com/support)
