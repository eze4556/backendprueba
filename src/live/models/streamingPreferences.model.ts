import { Schema, Document, model } from 'mongoose';

export interface IStreamingPreferences extends Document {
  userId: string;
  cameraId: string;
  microphoneId: string;
  videoQuality: '1080p' | '720p' | '480p' | '360p';
}

const StreamingPreferencesSchema = new Schema<IStreamingPreferences>({
  userId: { type: String, required: true, unique: true },
  cameraId: { type: String },
  microphoneId: { type: String },
  videoQuality: { type: String, enum: ['1080p', '720p', '480p', '360p'] }
}, { timestamps: true });

export const StreamingPreferences = model<IStreamingPreferences>('StreamingPreferences', StreamingPreferencesSchema);