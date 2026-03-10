// backend/src/db/models/User.ts
import mongoose, { Schema, model, type Model } from 'mongoose';

interface IUser {
  googleSub: string;
  email: string;
  name: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  googleSub: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false });

// Guard against model re-registration in test environments with module resets
export const User: Model<IUser> =
  (mongoose.models.User as Model<IUser>) ?? model<IUser>('User', userSchema);
