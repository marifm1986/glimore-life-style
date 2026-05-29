const readline = require('readline');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) return;

    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  });
}

const initializeFirebaseAdmin = () => {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (rawServiceAccount) {
    try {
      const serviceAccount = JSON.parse(rawServiceAccount);
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
      });
    } catch (error) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON. Falling back to Application Default Credentials.');
    }
  }

  if (process.env.FIREBASE_PROJECT_ID) {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  throw new Error(
    'Firebase configuration not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PROJECT_ID in .env.local, or configure Google Application Default Credentials.'
  );
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (prompt) => {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
};

async function createSuperAdmin() {
  try {
    console.log('\n🔐 Super Admin Creation Script\n');

    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');
    const displayName = await question('Enter admin display name: ');

    // Validate inputs
    if (!email || !password || !displayName) {
      console.error('❌ All fields are required');
      rl.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      rl.close();
      process.exit(1);
    }

    console.log('\n⏳ Initializing Firebase Admin SDK...');
    const adminApp = initializeFirebaseAdmin();
    const authAdmin = admin.auth(adminApp);
    const dbAdmin = admin.firestore(adminApp);

    console.log('⏳ Creating user in Firebase Authentication...');

    // Create user in Firebase Auth
    const userRecord = await authAdmin.createUser({
      email,
      password,
      displayName,
    });

    console.log(`✅ User created with UID: ${userRecord.uid}`);

    console.log('⏳ Creating user profile in Firestore...');

    // Create user profile in Firestore
    const userProfileRef = dbAdmin.collection('users').doc(userRecord.uid);
    await userProfileRef.set({
      uid: userRecord.uid,
      email,
      displayName,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ User profile created in Firestore');

    // Set custom claims for Firebase
    console.log('⏳ Setting custom claims...');
    await authAdmin.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      isAdmin: true,
    });

    console.log('✅ Custom claims set\n');

    console.log('═══════════════════════════════════════');
    console.log('🎉 Super Admin Created Successfully!');
    console.log('═══════════════════════════════════════');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${displayName}`);
    console.log(`🔑 UID: ${userRecord.uid}`);
    console.log('═══════════════════════════════════════\n');

    rl.close();
    await adminApp.delete();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    rl.close();
    process.exit(1);
  }
}

createSuperAdmin();
