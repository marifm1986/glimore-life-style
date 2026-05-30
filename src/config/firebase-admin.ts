import * as admin from 'firebase-admin';

function parseServiceAccount(): admin.ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (!raw) return null;

  let parsed: any = null;

  // Try raw JSON first
  if (raw.startsWith('{')) {
    try { parsed = JSON.parse(raw); } catch { /* fall through */ }
  }

  // Try base64-encoded JSON
  if (!parsed) {
    try { parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8')); } catch { /* fall through */ }
  }

  if (!parsed) {
    console.error('[firebase-admin] Could not parse FIREBASE_SERVICE_ACCOUNT_KEY — check its format in Vercel env vars.');
    return null;
  }

  // Vercel escapes newlines in env vars — restore them in the private key
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }

  return parsed as admin.ServiceAccount;
}

function initializeFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) return admin.app();

  const serviceAccount = parseServiceAccount();

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: (serviceAccount as any).project_id || process.env.FIREBASE_PROJECT_ID,
    });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      '[firebase-admin] No credentials found. Set FIREBASE_SERVICE_ACCOUNT_KEY (JSON or base64) in your Vercel environment variables.'
    );
  }

  // Local dev with Application Default Credentials (gcloud auth)
  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId,
  });
}

const adminApp = initializeFirebaseAdmin();
const authAdmin = admin.auth(adminApp);
const dbAdmin = admin.firestore(adminApp);

try {
  dbAdmin.settings({ ignoreUndefinedProperties: true });
} catch {
  // Already set
}

export { adminApp, authAdmin, dbAdmin };
export default adminApp;
