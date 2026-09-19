import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { Admin } from '../models/Admin';

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: npm run reset-admin-password -- <email> <newPassword>');
    process.exit(1);
  }

  await connectDB();

  const admin = await Admin.findOne({ email });
  if (!admin) {
    console.error(`No admin found with email: ${email}`);
    await disconnectDB();
    process.exit(1);
  }

  admin.passwordHash = await bcrypt.hash(newPassword, 10);
  admin.twoFactorEnabled = false;
  await admin.save();

  console.log(`Password reset for ${email}. 2FA has been turned off — re-enable it after logging in.`);
  await disconnectDB();
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
