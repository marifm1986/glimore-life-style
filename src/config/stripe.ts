import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_glimore_style_51O123456789';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-01-27' as any, // Standard API version matching Stripe requirements
  typescript: true,
});

export default stripe;
