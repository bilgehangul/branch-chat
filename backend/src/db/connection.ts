// backend/src/db/connection.ts
// MongoDB Atlas connection via Mongoose.
// Gracefully skips connection when MONGODB_URI is not set (test/CI environments).
import mongoose from 'mongoose';

export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[connectDB] MONGODB_URI not set — skipping DB connection (test/CI mode)');
    return;
  }

  mongoose.connection.on('connected', () => console.log('[MongoDB] Connected'));
  mongoose.connection.on('error', (err) => console.error('[MongoDB] Error:', err));
  mongoose.connection.on('disconnected', () => console.warn('[MongoDB] Disconnected — Mongoose will retry automatically'));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000,
  });
}
