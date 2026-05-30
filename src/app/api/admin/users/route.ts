import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authAdmin, dbAdmin } from '@/config/firebase-admin';
import admin from 'firebase-admin';

function serializeUser(docData: any) {
  return {
    uid: docData.uid,
    email: docData.email,
    displayName: docData.displayName,
    role: docData.role || 'customer',
    superAdmin: docData.superAdmin || false,
    vendorId: docData.vendorId || null,
    createdAt: docData.createdAt?.toDate
      ? docData.createdAt.toDate().toISOString()
      : docData.createdAt?.toString() || '',
    updatedAt: docData.updatedAt?.toDate
      ? docData.updatedAt.toDate().toISOString()
      : docData.updatedAt?.toString() || '',
    shippingAddress: docData.shippingAddress || null,
  };
}

async function requireAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  const decoded = await authAdmin.verifySessionCookie(session, true);
  const userDoc = await dbAdmin.collection('users').doc(decoded.uid).get();
  const profile = userDoc.exists ? (userDoc.data() as any) : null;
  const role = profile?.role ?? decoded.role ?? 'customer';
  return role === 'admin' ? { uid: decoded.uid, role, superAdmin: profile?.superAdmin } : null;
}

export async function GET() {
  try {
    const caller = await requireAdmin();
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const snapshot = await dbAdmin.collection('users').get();
    const users = snapshot.docs.map((d) => serializeUser(d.data()));
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const caller = await requireAdmin();
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { email, password, displayName, role } = body as {
      email?: string;
      password?: string;
      displayName?: string;
      role?: string;
    };

    if (!email || !password || !displayName) {
      return NextResponse.json({ error: 'Email, password and name are required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    const validRole = ['customer', 'vendor', 'admin'].includes(role ?? '') ? role! : 'customer';

    const userRecord = await authAdmin.createUser({ email, password, displayName });

    await authAdmin.setCustomUserClaims(userRecord.uid, { role: validRole });

    const now = admin.firestore.FieldValue.serverTimestamp();
    await dbAdmin.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role: validRole,
      superAdmin: false,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ success: true, uid: userRecord.uid }, { status: 201 });
  } catch (error: any) {
    console.error('Admin users POST error:', error);
    const message = error?.errorInfo?.message || error?.message || 'Failed to create user';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const caller = await requireAdmin();
    if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await request.json();
    const { uid, role } = body as { uid?: string; role?: string };
    if (!uid || !role || !['customer', 'vendor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Super admins cannot be demoted through the UI
    const targetDoc = await dbAdmin.collection('users').doc(uid).get();
    if (!targetDoc.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if ((targetDoc.data() as any)?.superAdmin) {
      return NextResponse.json({ error: 'Cannot change role of a super admin' }, { status: 403 });
    }

    await dbAdmin.collection('users').doc(uid).update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Keep custom claims in sync
    await authAdmin.setCustomUserClaims(uid, { role });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin users PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
  }
}
