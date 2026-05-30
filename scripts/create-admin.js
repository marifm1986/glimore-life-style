const readline = require('readline');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ── Load .env.local ────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf-8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (!match) return;
      const key = match[1].trim();
      let value = match[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    });
}

// ── Firebase Admin init ────────────────────────────────────────────────────
function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.app();

  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const filePath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(filePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        console.log('  Loaded service account from FIREBASE_SERVICE_ACCOUNT_PATH');
      }
    } catch (e) {
      console.error('  Failed to parse FIREBASE_SERVICE_ACCOUNT_PATH:', e.message);
    }
  }

  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const trimmed = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      const possiblePath = path.resolve(trimmed);
      if (fs.existsSync(possiblePath)) {
        serviceAccount = JSON.parse(fs.readFileSync(possiblePath, 'utf-8'));
      } else if (trimmed.startsWith('{')) {
        serviceAccount = JSON.parse(trimmed);
      } else {
        serviceAccount = JSON.parse(Buffer.from(trimmed, 'base64').toString('utf-8'));
      }
    } catch (e) {
      console.error('  FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON, a file path, or base64 JSON.');
      throw e;
    }
  }

  if (serviceAccount) {
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
    });
  }

  if (process.env.FIREBASE_PROJECT_ID) {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }

  throw new Error(
    'Firebase config not found.\n' +
    'Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_KEY in .env.local,\n' +
    'or set FIREBASE_PROJECT_ID with Application Default Credentials.'
  );
}

// ── Interactive helpers ────────────────────────────────────────────────────
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(prompt) {
  return new Promise((resolve) => rl.question(prompt, resolve));
}

function askHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.openStdin();
    let password = '';

    // Use raw mode to hide keystrokes if the terminal supports it
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      process.stdin.on('data', function onData(ch) {
        ch = ch.toString('utf8');
        if (ch === '\n' || ch === '\r' || ch === '') {
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
        } else if (ch === '') {
          process.stdout.write('\n');
          process.exit();
        } else if (ch === '') {
          password = password.slice(0, -1);
        } else {
          password += ch;
        }
      });
    } else {
      // Non-TTY (piped input) — fall back to visible readline
      rl.question('', resolve);
    }
  });
}

// ── Main ───────────────────────────────────────────────────────────────────
async function createSuperAdmin() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   GLIMORE  —  Super Admin Creator   ║');
  console.log('╚══════════════════════════════════════╝\n');

  const email = (await ask('  Email address  : ')).trim();
  const password = await askHidden('  Password       : ');
  const displayName = (await ask('  Display name   : ')).trim();

  rl.close();

  // ── Validate ──────────────────────────────────────────────────────────
  if (!email || !password || !displayName) {
    console.error('\n  ERROR: All fields are required.\n');
    process.exit(1);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error('\n  ERROR: Invalid email address.\n');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('\n  ERROR: Password must be at least 8 characters.\n');
    process.exit(1);
  }

  // ── Firebase ──────────────────────────────────────────────────────────
  console.log('\n  Initializing Firebase Admin SDK...');
  let adminApp;
  try {
    adminApp = initializeFirebaseAdmin();
  } catch (e) {
    console.error('\n  ERROR:', e.message, '\n');
    process.exit(1);
  }

  const authAdmin = admin.auth(adminApp);
  const dbAdmin = admin.firestore(adminApp);

  try {
    // 1. Create Firebase Auth user
    console.log('  Creating Firebase Auth user...');
    const userRecord = await authAdmin.createUser({ email, password, displayName });
    console.log(`  Auth user created — UID: ${userRecord.uid}`);

    // 2. Write Firestore profile
    console.log('  Writing Firestore profile...');
    await dbAdmin.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      displayName,
      role: 'admin',
      superAdmin: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('  Firestore profile written.');

    // 3. Set custom claims (used by middleware / server-side role checks)
    console.log('  Setting custom claims...');
    await authAdmin.setCustomUserClaims(userRecord.uid, {
      role: 'admin',
      superAdmin: true,
    });
    console.log('  Custom claims set.');

    // ── Done ─────────────────────────────────────────────────────────
    console.log('\n╔══════════════════════════════════════╗');
    console.log('║      Super Admin Created!            ║');
    console.log('╚══════════════════════════════════════╝');
    console.log(`  Email   : ${email}`);
    console.log(`  Name    : ${displayName}`);
    console.log(`  UID     : ${userRecord.uid}`);
    console.log(`  Role    : admin  (superAdmin: true)\n`);

    await adminApp.delete();
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.error('\n  ERROR: That email is already registered.');
      console.error('  To promote an existing user to super admin, run:');
      console.error(`  node scripts/promote-admin.js ${email}\n`);
    } else {
      console.error('\n  ERROR:', error.message, '\n');
    }
    await adminApp.delete().catch(() => {});
    process.exit(1);
  }
}

createSuperAdmin();
