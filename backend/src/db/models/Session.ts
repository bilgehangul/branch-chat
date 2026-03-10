// backend/src/db/models/Session.ts
import mongoose, { Schema, model, type Model } from 'mongoose';

interface ISession {
  userId: string;        // googleSub from verified token
  createdAt: Date;
  lastActivityAt: Date;
}

const sessionSchema = new Schema<ISession>({
  userId: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now, index: true },
}, { timestamps: false });

// TTL: MongoDB auto-deletes sessions with no activity for 90 days
sessionSchema.index({ lastActivityAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const Session: Model<ISession> =
  (mongoose.models.Session as Model<ISession>) ?? model<ISession>('Session', sessionSchema);
