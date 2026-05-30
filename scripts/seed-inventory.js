const admin = require('firebase-admin');
const path  = require('path');
const fs    = require('fs');

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
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    });
}

// ── Firebase Admin init (same as create-admin.js) ─────────────────────────
function initFirebaseAdmin() {
  if (admin.apps.length > 0) return admin.app();

  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const fp = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      if (fs.existsSync(fp)) serviceAccount = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    } catch (e) { console.error('  FIREBASE_SERVICE_ACCOUNT_PATH error:', e.message); }
  }

  if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
      const fp  = path.resolve(raw);
      if (fs.existsSync(fp))        serviceAccount = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      else if (raw.startsWith('{')) serviceAccount = JSON.parse(raw);
      else                          serviceAccount = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
    } catch (e) { throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is invalid: ' + e.message); }
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
    'Firebase config missing.\n' +
    'Set FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_KEY in .env.local.'
  );
}

// ── Status normaliser ──────────────────────────────────────────────────────
function normaliseStatus(raw) {
  const s = (raw || '').toLowerCase().replace(/\s+/g, '-');
  if (s === 'in-stock'  || s === 'in stock')  return 'in-stock';
  if (s === 'low-stock' || s === 'low stock') return 'low-stock';
  return 'out-of-stock';
}

// ── Products to seed ───────────────────────────────────────────────────────
const products = [
  {
    productName: "Premium Polo Shirt",
    sku: "TSH-004",
    brandCollection: "Business Casual",
    stock: 22,
    price: 3499,
    materialFabric: "Pique Cotton",
    variantFeature: "Navy Blue, Size M",
    productImage: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d",
    description: "Premium cotton polo shirt designed for business casual and everyday wear.",
    category: "CLOTHING",
    status: "In Stock"
  },
  {
    productName: "Classic White T-Shirt",
    sku: "TSH-001",
    brandCollection: "Essentials",
    stock: 50,
    price: 1999,
    materialFabric: "100% Cotton",
    variantFeature: "White, Size L",
    productImage: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    description: "Comfortable everyday white t-shirt with a regular fit.",
    category: "CLOTHING",
    status: "In Stock"
  },
  {
    productName: "Oversized Street Tee",
    sku: "TSH-002",
    brandCollection: "Streetwear",
    stock: 35,
    price: 2499,
    materialFabric: "Heavy Cotton",
    variantFeature: "Black, Size XL",
    productImage: "https://images.unsplash.com/photo-1503341504253-dff4815485f1",
    description: "Modern oversized t-shirt perfect for casual street fashion.",
    category: "CLOTHING",
    status: "In Stock"
  },
  {
    productName: "Slim Fit Denim Jacket",
    sku: "CLT-001",
    brandCollection: "Denim Collection",
    stock: 15,
    price: 6999,
    materialFabric: "Premium Denim",
    variantFeature: "Blue, Size M",
    productImage: "https://images.unsplash.com/photo-1542272604-787c3835537a",
    description: "Stylish slim-fit denim jacket with classic design.",
    category: "CLOTHING",
    status: "In Stock"
  },
  {
    productName: "Casual Hoodie",
    sku: "CLT-002",
    brandCollection: "Winter Wear",
    stock: 25,
    price: 4999,
    materialFabric: "Fleece Cotton",
    variantFeature: "Gray, Size L",
    productImage: "https://images.unsplash.com/photo-1556821840-3a63f95609a7",
    description: "Warm fleece hoodie for winter comfort.",
    category: "CLOTHING",
    status: "In Stock"
  },
  {
    productName: "Running Sneakers",
    sku: "SHO-001",
    brandCollection: "Performance",
    stock: 40,
    price: 7999,
    materialFabric: "Mesh Fabric",
    variantFeature: "Black/White, Size 42",
    productImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    description: "Lightweight running shoes with cushioned sole.",
    category: "SHOES",
    status: "In Stock"
  },
  {
    productName: "White Leather Sneakers",
    sku: "SHO-002",
    brandCollection: "Lifestyle",
    stock: 32,
    price: 8999,
    materialFabric: "Genuine Leather",
    variantFeature: "White, Size 43",
    productImage: "https://images.unsplash.com/photo-1549298916-b41d501d3772",
    description: "Minimalist leather sneakers for everyday style.",
    category: "SHOES",
    status: "In Stock"
  },
  {
    productName: "High Top Sneakers",
    sku: "SHO-003",
    brandCollection: "Streetwear",
    stock: 18,
    price: 9499,
    materialFabric: "Canvas",
    variantFeature: "Black, Size 42",
    productImage: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77",
    description: "Classic high-top sneakers inspired by urban fashion.",
    category: "SHOES",
    status: "In Stock"
  },
  {
    productName: "Leather Loafers",
    sku: "SHO-004",
    brandCollection: "Formal",
    stock: 14,
    price: 10999,
    materialFabric: "Leather",
    variantFeature: "Brown, Size 41",
    productImage: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4",
    description: "Elegant leather loafers suitable for formal occasions.",
    category: "SHOES",
    status: "In Stock"
  },
  {
    productName: "Hiking Boots",
    sku: "SHO-005",
    brandCollection: "Adventure",
    stock: 10,
    price: 12999,
    materialFabric: "Leather & Rubber",
    variantFeature: "Khaki, Size 44",
    productImage: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77",
    description: "Durable hiking boots built for outdoor adventures.",
    category: "SHOES",
    status: "Low Stock"
  }
];

// ── Main ───────────────────────────────────────────────────────────────────
async function seedInventory() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   GLIMORE  —  Inventory Seed         ║');
  console.log('╚══════════════════════════════════════╝\n');

  console.log('  Initializing Firebase Admin SDK...');
  let app;
  try {
    app = initFirebaseAdmin();
  } catch (e) {
    console.error('\n  ERROR:', e.message, '\n');
    process.exit(1);
  }

  const db = admin.firestore(app);
  const ts = admin.firestore.FieldValue.serverTimestamp();

  // Check for existing SKUs to avoid duplicates
  console.log('  Checking existing inventory for duplicate SKUs...');
  const existing = await db.collection('inventory').get();
  const existingSkus = new Set(existing.docs.map(d => d.data().sku).filter(Boolean));

  let added = 0;
  let skipped = 0;

  for (const p of products) {
    if (existingSkus.has(p.sku)) {
      console.log(`  SKIP  ${p.sku.padEnd(12)} "${p.productName}" — already exists`);
      skipped++;
      continue;
    }

    const doc = {
      productName: p.productName,
      sku:         p.sku,
      collection:  p.brandCollection,
      stock:       p.stock,
      price:       p.price,
      material:    p.materialFabric,
      gemstone:    p.variantFeature,
      image:       p.productImage,
      description: p.description,
      category:    p.category,
      status:      normaliseStatus(p.status),
      createdAt:   ts,
      updatedAt:   ts,
    };

    await db.collection('inventory').add(doc);
    console.log(`  ADD   ${p.sku.padEnd(12)} "${p.productName}"`);
    added++;
  }

  console.log(`\n  Done — ${added} added, ${skipped} skipped.\n`);
  await app.delete();
  process.exit(0);
}

seedInventory().catch((e) => {
  console.error('\n  FATAL:', e.message, '\n');
  process.exit(1);
});
