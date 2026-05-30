import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authAdmin, dbAdmin } from '@/config/firebase-admin';

const FIVE_DAYS_MS = 60 * 60 * 24 * 5 * 1000;
const FIVE_DAYS_S  = 60 * 60 * 24 * 5;

function cookieOptions(maxAge: number) {
  return {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
  };
}

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    const cookieStore = await cookies();

    // Verify the ID token to get the UID and any custom claims
    const decoded = await authAdmin.verifyIdToken(idToken);

    // Resolve role: custom claim → Firestore profile → default
    let role: string = (decoded.role as string | undefined) || '';
    if (!role) {
      const userDoc = await dbAdmin.collection('users').doc(decoded.uid).get();
      role = userDoc.exists ? (((userDoc.data() as any)?.role as string) || 'customer') : 'customer';
    }

    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn: FIVE_DAYS_MS });

    cookieStore.set('session', sessionCookie, cookieOptions(FIVE_DAYS_S));
    cookieStore.set('user-role', role, cookieOptions(FIVE_DAYS_S));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Session API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const clear = cookieOptions(0);
  cookieStore.set('session', '', clear);
  cookieStore.set('user-role', '', clear);
  return NextResponse.json({ success: true });
}
