# Resend Email Setup

This application uses Resend to send email notifications to customers for booking confirmations, cancellations, payment failures, and refunds.

## Setup Steps

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address

### 2. Get Your API Key

1. Go to [API Keys](https://resend.com/api-keys)
2. Click "Create API Key"
3. Give it a name (e.g., "Production" or "Development")
4. Copy the API key (starts with `re_`)

### 3. Add Environment Variables

Add these to your Vercel project environment variables or `.env.local`:

\`\`\`
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
COMPANY_NAME=Your Company Name
\`\`\`

**Important Notes:**
- `RESEND_API_KEY` is required
- `EMAIL_FROM_ADDRESS` defaults to `onboarding@resend.dev` if not set
- `COMPANY_NAME` defaults to "Your Company" if not set

### 4. Verify Your Domain (Production)

For production use, you need to verify your domain:

1. Go to [Domains](https://resend.com/domains) in Resend dashboard
2. Click "Add Domain"
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records provided by Resend to your domain's DNS settings
5. Wait for verification (usually takes a few minutes)

Once verified, update `EMAIL_FROM_ADDRESS` to use your domain:
\`\`\`
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
\`\`\`

### 5. Test Email Sending

#### Development Testing

In development, you can use the default `onboarding@resend.dev` address to test:

1. Make a test booking
2. Check the console logs for email sending status
3. Check your email inbox for the confirmation

#### Production Testing

1. Verify your domain first
2. Update `EMAIL_FROM_ADDRESS` to your domain
3. Make a test booking
4. Check Resend dashboard for email logs

## Email Templates

The application includes 4 email templates:

1. **Booking Confirmation** - Sent when payment is successful
2. **Booking Cancellation** - Sent when a booking is cancelled
3. **Payment Failed** - Sent when payment processing fails
4. **Refund Notification** - Sent when a refund is processed

All templates are located in `/components/emails/` and use React components for easy customization.

## Customizing Email Templates

To customize the email templates:

1. Edit the files in `/components/emails/`
2. Modify the HTML/CSS inline styles
3. Update the content and branding
4. Test by sending a test email

## Email Sending Flow

### Booking Confirmation
- **Trigger**: Stripe webhook `checkout.session.completed`
- **File**: `/app/api/stripe/webhook/route.ts`
- **Function**: `handleCheckoutCompleted()`

### Cancellation
- **Trigger**: Admin cancels booking
- **File**: `/app/api/bookings/cancel/route.ts`
- **Function**: `POST` handler

### Payment Failed
- **Trigger**: Stripe webhook `payment_intent.payment_failed`
- **File**: `/app/api/stripe/webhook/route.ts`
- **Function**: `handlePaymentFailed()`

### Refund Notification
- **Trigger**: Stripe webhook `charge.refunded`
- **File**: `/app/api/stripe/webhook/route.ts`
- **Function**: `handleRefund()`

## Troubleshooting

### Emails Not Sending

1. Check that `RESEND_API_KEY` is set correctly
2. Check console logs for error messages
3. Verify your domain is verified (for production)
4. Check Resend dashboard for delivery logs

### Emails Going to Spam

1. Verify your domain with SPF, DKIM, and DMARC records
2. Use a professional "from" address (not gmail, yahoo, etc.)
3. Avoid spam trigger words in subject lines
4. Include an unsubscribe link (for marketing emails)

### Rate Limits

Resend has rate limits based on your plan:
- Free: 100 emails/day
- Pro: 50,000 emails/month
- Enterprise: Custom limits

Check your [Resend dashboard](https://resend.com/overview) for current usage.

## Best Practices

1. **Always verify your domain** for production use
2. **Test emails** in development before deploying
3. **Monitor email logs** in Resend dashboard
4. **Handle errors gracefully** - don't fail bookings if email fails
5. **Keep templates simple** - avoid complex CSS that may not render in all email clients
6. **Include contact information** in all emails
7. **Make unsubscribe easy** (for marketing emails)

## Support

- Resend Documentation: https://resend.com/docs
- Resend Support: https://resend.com/support
- Next.js Integration: https://resend.com/docs/send-with-nextjs
