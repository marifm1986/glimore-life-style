import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import stripe from '@/config/stripe';
import { dbAdmin } from '@/config/firebase-admin';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature') as string;

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook Error constructing event:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (metadata && metadata.orderId) {
      try {
        const batch = dbAdmin.batch();
        const orderRef = dbAdmin.collection('orders').doc(metadata.orderId);

        batch.update(orderRef, {
          paymentStatus: 'paid',
          stripePaymentIntentId: session.payment_intent as string,
          updatedAt: new Date(),
        });

        // Fetch the order items to update stock
        const orderDoc = await orderRef.get();
        const orderData = orderDoc.data();

        if (orderData && orderData.items) {
          orderData.items.forEach((item: any) => {
            const productRef = dbAdmin.collection('products').doc(item.productId);
            batch.update(productRef, {
              stock: admin.firestore.FieldValue.increment(-item.quantity),
            });
          });
        }

        await batch.commit();
        console.log(`Order ${metadata.orderId} successfully completed and stock updated.`);
      } catch (dbError) {
        console.error(`Failed to update order database state on webhook:`, dbError);
      }
    }
  }

  return NextResponse.json({ received: true });
}
