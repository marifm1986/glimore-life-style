# Create Super Admin User - CLI Guide

## Prerequisites

1. **Environment Setup**: Make sure your `.env.local` file has the Firebase configuration:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
   ```

   OR set the service account environment variable directly.

2. **Dependencies**: Install required packages:
   ```bash
   npm install
   ```

## How to Use

### Option 1: Using npm script (Recommended)

```bash
npm run create:admin
```

### Option 2: Using Node directly

```bash
node scripts/create-admin.js
```

### Option 3: Using TypeScript (if ts-node is available)

```bash
npx ts-node scripts/create-admin.ts
```

## What the Script Does

1. Prompts you to enter:
   - Admin email
   - Admin password (minimum 6 characters)
   - Admin display name

2. Creates the user in Firebase Authentication

3. Creates a user profile document in Firestore with:
   - `role: 'admin'`
   - Email, display name
   - Timestamps

4. Sets custom claims in Firebase:
   - `role: 'admin'`
   - `isAdmin: true`

## Example Execution

```
🔐 Super Admin Creation Script

Enter admin email: admin@glimore-style.com
Enter admin password: SecurePassword123
Enter admin display name: Admin User

⏳ Initializing Firebase Admin SDK...
⏳ Creating user in Firebase Authentication...
✅ User created with UID: abc123xyz456
⏳ Creating user profile in Firestore...
✅ User profile created in Firestore
⏳ Setting custom claims...
✅ Custom claims set

═══════════════════════════════════════
🎉 Super Admin Created Successfully!
═══════════════════════════════════════
📧 Email: admin@glimore-style.com
👤 Name: Admin User
🔑 UID: abc123xyz456
═══════════════════════════════════════
```

## Troubleshooting

### Firebase Configuration Not Found
- Ensure `.env.local` exists in the project root
- Set either `FIREBASE_SERVICE_ACCOUNT_KEY` or `FIREBASE_PROJECT_ID`

### Password Too Short
- Password must be at least 6 characters long

### Email Already Exists
- The email is already registered in Firebase Authentication
- Use a different email address

### Permission Denied
- Ensure the service account has the necessary permissions:
  - `roles/editor` or custom roles with Firestore and Auth permissions

## Creating Additional Admins

Simply run the script again with different email addresses to create more admin users.

## Notes

- The script uses interactive prompts for security (passwords won't be visible)
- All timestamps are set on the server
- Custom claims are used for easy role verification on the client side
- The Firestore document is created in the `users` collection
