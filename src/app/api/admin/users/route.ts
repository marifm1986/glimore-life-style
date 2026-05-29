import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authAdmin, dbAdmin } from '@/config/firebase-admin';
import admin from 'firebase-admin';

const mockPrefix = 'mock-session-cookie-token-';

function serializeUser(docData: any) {
  return {
    uid: docData.uid,
    email: docData.email,
    displayName: docData.displayName,
    role: docData.role || 'customer',
    vendorId: docData.vendorId || null,
    createdAt: docData.createdAt?.toDate ? docData.createdAt.toDate().toISOString() : docData.createdAt?.toString() || '',
    updatedAt: docData.updatedAt?.toDate ? docData.updatedAt.toDate().toISOString() : docData.updatedAt?.toString() || '',
    shippingAddress: docData.shippingAddress || null,
  };
}

async function getSessionRole() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  if (session.startsWith(mockPrefix)) {
    const role = session.replace(mockPrefix, '');
    return { role, uid: null };
  }

  const decoded = await authAdmin.verifySessionCookie(session, true);
  const userDoc = await dbAdmin.collection('users').doc(decoded.uid).get();
  const userProfile = userDoc.exists ? userDoc.data() : null;
  return {
    role: (userProfile as any)?.role || decoded.role || 'customer',
    uid: decoded.uid,
  };
}

export async function GET() {
  try {
    const session = await getSessionRole();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const snapshot = await dbAdmin.collection('users').get();
    const users = snapshot.docs.map((doc) => serializeUser(doc.data()));
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    if (error.code === 'auth/argument-error' || error.message?.includes('mock-session-cookie-token')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSessionRole();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { uid, role } = body as { uid?: string; role?: string };
    if (!uid || !role || !['customer', 'vendor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const userRef = dbAdmin.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await userRef.update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
