/**
 * GyanSutra Academy — first admin setup script
 *
 * Run ONCE after deployment:
 *   node scripts/createAdmin.js
 *
 * Set these env vars before running (locally or on Render shell):
 *   MONGODB_URI   — your Atlas connection string
 *   ADMIN_EMAIL   — the admin email address
 *   ADMIN_PASSWORD — a strong password (min 12 chars)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { Admin } from '../models/Admin.js';

const { MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    '\n[createAdmin] Missing required environment variables.\n' +
    'Set MONGODB_URI, ADMIN_EMAIL, and ADMIN_PASSWORD before running this script.\n'
  );
  process.exit(1);
}

if (ADMIN_PASSWORD.length < 12) {
  console.error('[createAdmin] Password must be at least 12 characters.');
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log('[createAdmin] Connected to MongoDB.');

  const existing = await Admin.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    console.log('[createAdmin] An admin with this email already exists. Nothing was changed.');
    process.exit(0);
  }

  // passwordHash field is pre-save hashed via the model hook
  await Admin.create({ email: ADMIN_EMAIL.toLowerCase(), passwordHash: ADMIN_PASSWORD });
  console.log(`[createAdmin] Admin created: ${ADMIN_EMAIL}`);
  console.log('[createAdmin] You can now log in at /admin/login.html');

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('[createAdmin] Error:', err.message);
  process.exit(1);
});