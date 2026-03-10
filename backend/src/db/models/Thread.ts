// backend/src/db/models/Thread.ts
// Thread stores branch relationships. _id is stored as String (frontend UUID).
// messageIds are NOT stored — reconstructed on load from Message.find({ threadId }).
import mongoose, { Schema, model, type Model } from 'mongoose';

interface IThread {
  _id: string;              // frontend-generated crypto.randomUUID()
  sessionId: string;
  userId: string;
  parentThreadId: string | null;
  depth: number;            // 0-4
  anchorText: string | null;
  parentMessageId: string | null;
  title: string;
  accentColor: string;
  childThreadIds: string[];
  scrollPosition: number;
  createdAt: Date;
}

const threadSchema = new Schema<IThread>({
  _id: { type: String },    // use frontend UUID as _id
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  parentThreadId: { type: String, default: null },
  depth: { type: Number, required: true, min: 0, max: 4 },
  anchorText: { type: String, default: null },
  parentMessageId: { type: String, default: null },
  title: { type: String, required: true },
  accentColor: { type: String, required: true },
  childThreadIds: [String],
  scrollPosition: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: false, _id: false }); // _id: false so Mongoose doesn't auto-create ObjectId

export const Thread: Model<IThread> =
  (mongoose.models.Thread as Model<IThread>) ?? model<IThread>('Thread', threadSchema);
