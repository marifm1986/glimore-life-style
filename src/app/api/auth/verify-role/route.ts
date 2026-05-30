import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authAdmin, dbAdmin } from '@/config/firebase-admin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ role: 'guest' });
    }

    const decoded = await authAdmin.verifySessionCookie(session, true);

    // Prefer Firestore profile (most up-to-date) over stale token claims
    const userDoc = await dbAdmin.collection('users').doc(decoded.uid).get();
    const role = userDoc.exists
      ? ((userDoc.data() as any)?.role ?? 'customer')
      : (decoded.role as string | undefined) ?? 'customer';

    return NextResponse.json({ role, uid: decoded.uid, email: decoded.email });
  } catch (error) {
    return NextResponse.json({ role: 'guest' }, { status: 401 });
  }
}
