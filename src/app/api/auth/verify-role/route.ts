import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authAdmin } from '@/config/firebase-admin';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('session')?.value;

    if (!session) {
      return NextResponse.json({ role: 'guest' });
    }

    // Mock role parser
    if (session.startsWith('mock-session-cookie-token-')) {
      const role = session.replace('mock-session-cookie-token-', '');
      return NextResponse.json({ role });
    }

    // Real Firebase Session verification
    try {
      const decodedClaims = await authAdmin.verifySessionCookie(session, true);
      // Fetch user role claim (defaulting to customer if not set)
      const role = decodedClaims.role || 'customer';
      return NextResponse.json({ role, uid: decodedClaims.uid, email: decodedClaims.email });
    } catch (verifyError) {
      console.warn('Session verification failed, treating as invalid:', verifyError);
      return NextResponse.json({ role: 'guest' }, { status: 401 });
    }
  } catch (error) {
    console.error('Verify Role API error:', error);
    return NextResponse.json({ role: 'guest' }, { status: 500 });
  }
}
