import * as admin from 'firebase-admin';

function parseServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) return null;

  let parsed: any = null;

  if (raw.startsWith('{')) {
    try { parsed = JSON.parse(raw); } catch { /* fall through */ }
  }

  if (!parsed) {
    try { parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')); } catch { /* fall through */ }
  }

  if (!parsed) {
    console.error('[firebase-admin] Could not parse FIREBASE_SERVICE_ACCOUNT_KEY.');
    return null;
  }

  // Vercel stores newlines as literal \n in env vars — restore them
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }

  return parsed as admin.ServiceAccount;
}

let _app: admin.app.App | null = null;
let _initError: Error | null = null;

function getAdminApp(): admin.app.App {
  if (_app) return _app;
  if (_initError) throw _initError;

  if (admin.apps.length > 0) {
    _app = admin.app();
    return _app;
  }

  try {
    const serviceAccount = parseServiceAccount();

    if (serviceAccount) {
      _app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: (serviceAccount as any).project_id || process.env.FIREBASE_PROJECT_ID,
      });
      return _app;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (projectId) {
      _app = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
      return _app;
    }

    throw new Error(
      'Firebase Admin SDK not configured. ' +
      'Add FIREBASE_SERVICE_ACCOUNT_KEY (JSON or base64) to your Vercel environment variables.'
    );
  } catch (e: any) {
    _initError = e;
    throw e;
  }
}

// Lazy proxies — only initialize when first called
export const authAdmin = new Proxy({} as admin.auth.Auth, {
  get(_target, prop) {
    const app = getAdminApp();
    const auth = admin.auth(app);
    return (auth as any)[prop];
  },
});

export const dbAdmin = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const app = getAdminApp();
    const db = admin.firestore(app);
    try { db.settings({ ignoreUndefinedProperties: true }); } catch { /* already set */ }
    return (db as any)[prop];
  },
});

export const adminApp = new Proxy({} as admin.app.App, {
  get(_target, prop) {
    return (getAdminApp() as any)[prop];
  },
});

export default adminApp;
