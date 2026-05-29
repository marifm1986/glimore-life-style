import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authAdmin } from '@/config/firebase-admin';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();
    const cookieStore = await cookies();

    // Support mock session cookie generation
    if (idToken.startsWith('mock-')) {
      const mockRole = idToken.split('-')[1] || 'customer';
      cookieStore.set('session', `mock-session-cookie-token-${mockRole}`, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 5, // 5 days
      });
      return NextResponse.json({ success: true, role: mockRole });
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await authAdmin.createSessionCookie(idToken, { expiresIn });

    cookieStore.set('session', sessionCookie, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 5, // 5 days
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Session API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    path: '/',
    maxAge: 0,
  });
  return NextResponse.json({ success: true });
}
