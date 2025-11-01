# Stripe Webhook Setup

To ensure bookings, payments, and customers are properly synchronized with the database, you need to set up a Stripe webhook.

## Why Webhooks?

Webhooks provide a reliable way to receive notifications from Stripe when events occur (like successful payments). This ensures data is saved even if the user closes their browser before the success page loads.

## Setup Steps

### 1. Get Your Webhook Endpoint URL

Your webhook endpoint is: `https://your-domain.com/api/stripe/webhook`

For local development: `http://localhost:3000/api/stripe/webhook`

### 2. Create Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL
4. Select events to listen to:
   - `checkout.session.completed` (required)
   - `payment_intent.succeeded` (recommended)
   - `payment_intent.payment_failed` (recommended)
   - `charge.refunded` (recommended)
5. Click "Add endpoint"

### 3. Get Your Webhook Secret

After creating the webhook:
1. Click on the webhook in the list
2. Click "Reveal" under "Signing secret"
3. Copy the secret (starts with `whsec_`)

### 4. Add Webhook Secret to Environment Variables

Add this to your Vercel project environment variables:

\`\`\`
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
\`\`\`

### 5. Test the Webhook

#### Local Testing with Stripe CLI

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward events: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Use the webhook secret from the CLI output

#### Production Testing

1. Make a test payment through your app
2. Check Stripe Dashboard → Webhooks → Your endpoint
3. View the event logs to confirm delivery
4. Check your database to confirm booking was created

## What the Webhook Does

When a payment is completed, the webhook:

1. **Creates/Updates Customer**: Finds existing customer by email or creates new one
2. **Creates/Updates Booking**: Creates booking with "confirmed" status
3. **Creates Payment Record**: Tracks the Stripe payment in the payments table
4. **Updates Customer Stats**: Updates total bookings and spending

## Troubleshooting

### Webhook Not Receiving Events

- Check that the URL is correct and publicly accessible
- Verify the webhook secret is correct
- Check Stripe Dashboard for delivery attempts and errors

### Database Not Updating

- Check the webhook logs in Stripe Dashboard
- Look for errors in your application logs
- Verify database tables exist (run SQL scripts)
- Check RLS policies allow inserts

### Duplicate Bookings

- The webhook is idempotent - it checks for existing bookings by session_id
- If a booking exists, it updates it instead of creating a duplicate

## Security

- The webhook verifies the Stripe signature to ensure requests are authentic
- Never disable signature verification in production
- Keep your webhook secret secure and never commit it to version control
