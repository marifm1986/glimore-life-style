import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authAdmin, dbAdmin } from '@/config/firebase-admin';
import { notifyAdmins } from '@/lib/webpush';

export async function POST() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const decoded = await authAdmin.verifySessionCookie(session, true);
    const snap = await dbAdmin.collection('users').doc(decoded.uid).get();
    const role = snap.exists ? (snap.data() as any).role : 'customer';
    if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await notifyAdmins({
    title: '🔔 Test Notification',
    body: 'Push notifications are working! Order alerts will appear here.',
    url: '/admin',
    tag: 'push-test',
  });

  return NextResponse.json({ success: true });
}
