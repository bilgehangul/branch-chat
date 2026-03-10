// backend/src/db/models/Message.ts
// Message stores full content after stream completes (not during streaming).
// annotations and childLeads stored as Mixed (JSON blobs) to avoid schema explosion.
// _id uses frontend-generated UUID.
import mongoose, { Schema, model, type Model } from 'mongoose';

interface IMessage {
  _id: string;              // frontend-generated crypto.randomUUID()
  threadId: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  annotations: unknown;     // Schema.Types.Mixed — preserves Annotation[] structure
  childLeads: unknown;      // Schema.Types.Mixed — preserves ChildLead[] structure
}

const messageSchema = new Schema<IMessage>({
  _id: { type: String },
  threadId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true },
  userId: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  annotations: { type: Schema.Types.Mixed, default: [] },
  childLeads: { type: Schema.Types.Mixed, default: [] },
}, { timestamps: false, _id: false });

export const Message: Model<IMessage> =
  (mongoose.models.Message as Model<IMessage>) ?? model<IMessage>('Message', messageSchema);
