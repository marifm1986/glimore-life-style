import { NextResponse } from 'next/server';
import stripe from '@/config/stripe';
import { dbAdmin } from '@/config/firebase-admin';
import { notifyAdmins } from '@/lib/webpush';

const isMockStripe = !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.startsWith('sk_test_mock');

export async function POST(request: Request) {
  try {
    const { cartItems, customerEmail, customerId, shippingAddress } = await request.json();

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Calculate total amount in cents
    const totalAmount = cartItems.reduce((total: number, item: any) => total + (item.price * item.quantity), 0);

    // Write a pending order to Firestore
    const orderId = `order_${Math.random().toString(36).substr(2, 9)}`;
    const pendingOrder = {
      id: orderId,
      customerId: customerId || 'guest',
      customerEmail: customerEmail || 'guest@glimore.style',
      items: cartItems,
      totalAmount,
      stripePaymentIntentId: isMockStripe ? `mock-payment-intent-${Math.random().toString(36).substr(2, 5)}` : '',
      paymentStatus: 'pending',
      shippingStatus: 'processing',
      shippingAddress: shippingAddress || {
        line1: '12 Luxury Boulevard',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Attempt to write order to Firestore via Admin SDK
    try {
      await dbAdmin.collection('orders').doc(orderId).set(pendingOrder);
    } catch (dbError) {
      console.warn('Firestore failed to write order (likely local simulation):', dbError);
    }

    // Notify admins — fire and forget, never block checkout
    notifyAdmins({
      title: '🛒 New Order Received',
      body: `${customerEmail || 'A customer'} placed an order for ${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}.`,
      url: '/admin/orders',
      tag: `order-${orderId}`,
    }).catch(() => {});

    if (isMockStripe) {
      // Simulate checkout session redirect URL
      const mockCheckoutUrl = `${new URL(request.url).origin}/order-success?order_id=${orderId}&session_id=mock_stripe_session_${Date.now()}`;
      return NextResponse.json({
        id: `mock_stripe_session_${Date.now()}`,
        url: mockCheckoutUrl,
        isMock: true,
      });
    }

    // Build real line items for Stripe Checkout
    const lineItems = cartItems.map((item: any) => ({
      price_data: {
        currency: 'bdt',
        product_data: {
          name: item.title,
          images: [item.image],
        },
        unit_amount: item.price, // Already in cents
      },
      quantity: item.quantity,
    }));

    // Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${new URL(request.url).origin}/order-success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(request.url).origin}/cart`,
      customer_email: customerEmail,
      metadata: {
        orderId,
      },
    });

    return NextResponse.json({ id: session.id, url: session.url, isMock: false });
  } catch (error: any) {
    console.error('Stripe Session Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
