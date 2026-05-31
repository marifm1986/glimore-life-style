import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authAdmin, dbAdmin } from '@/config/firebase-admin';

async function requireAdminUid(): Promise<string | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;
  try {
    const decoded = await authAdmin.verifySessionCookie(session, true);
    const snap = await dbAdmin.collection('users').doc(decoded.uid).get();
    const role = snap.exists ? (snap.data() as any).role : 'customer';
    return role === 'admin' ? decoded.uid : null;
  } catch {
    return null;
  }
}

function endpointToDocId(endpoint: string) {
  return Buffer.from(endpoint).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 64);
}

// Save a new push subscription
export async function POST(request: Request) {
  const uid = await requireAdminUid();
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subscription } = await request.json();
  if (!subscription?.endpoint) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });

  await dbAdmin.collection('push_subscriptions').doc(endpointToDocId(subscription.endpoint)).set({
    uid,
    subscription,
    createdAt: new Date(),
  });

  return NextResponse.json({ success: true });
}

// Remove a push subscription (unsubscribe)
export async function DELETE(request: Request) {
  const uid = await requireAdminUid();
  if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { endpoint } = await request.json();
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });

  await dbAdmin.collection('push_subscriptions').doc(endpointToDocId(endpoint)).delete();
  return NextResponse.json({ success: true });
}
