"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreferences = exports.savePreferences = void 0;
const streamingPreferences_model_1 = require("../models/streamingPreferences.model");
const savePreferences = async (req, res) => {
    const { userId, cameraId, microphoneId, videoQuality } = req.body;
    try {
        const prefs = await streamingPreferences_model_1.StreamingPreferences.findOneAndUpdate({ userId }, { cameraId, microphoneId, videoQuality }, { upsert: true, new: true });
        res.json({ success: true, preferences: prefs });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.savePreferences = savePreferences;
const getPreferences = async (req, res) => {
    const { userId } = req.params;
    try {
        const prefs = await streamingPreferences_model_1.StreamingPreferences.findOne({ userId });
        res.json({ success: true, preferences: prefs });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.getPreferences = getPreferences;
//# sourceMappingURL=streamingPreferences.controller.js.map