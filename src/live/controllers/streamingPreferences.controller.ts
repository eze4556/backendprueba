import { Request, Response } from 'express';
import { StreamingPreferences } from '../models/streamingPreferences.model';

export const savePreferences = async (req: Request, res: Response) => {
  const { userId, cameraId, microphoneId, videoQuality } = req.body;
  try {
    const prefs = await StreamingPreferences.findOneAndUpdate(
      { userId },
      { cameraId, microphoneId, videoQuality },
      { upsert: true, new: true }
    );
    res.json({ success: true, preferences: prefs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getPreferences = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const prefs = await StreamingPreferences.findOne({ userId });
    res.json({ success: true, preferences: prefs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};