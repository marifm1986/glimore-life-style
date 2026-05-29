import * as admin from 'firebase-admin';

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  let serviceAccount = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (parseError) {
      console.warn('Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON; falling back to environment config.', parseError);
      serviceAccount = null;
    }
  }

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  // Fallback for development without service account - uses default or env configs
  if (process.env.FIREBASE_PROJECT_ID) {
    return admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  // Pure fallback for initial run to prevent crash
  return admin.initializeApp({
    projectId: 'glimore-style-fallback',
  });
};

const adminApp = initializeFirebaseAdmin();
const authAdmin = admin.auth(adminApp);
const dbAdmin = admin.firestore(adminApp);

// Try to enable firestore settings
try {
  dbAdmin.settings({ ignoreUndefinedProperties: true });
} catch (e) {
  // Already initialized or not supported in this env
}

export { adminApp, authAdmin, dbAdmin };
export default adminApp;
