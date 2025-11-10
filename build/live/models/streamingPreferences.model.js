"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingPreferences = void 0;
const mongoose_1 = require("mongoose");
const StreamingPreferencesSchema = new mongoose_1.Schema({
    userId: { type: String, required: true, unique: true },
    cameraId: { type: String },
    microphoneId: { type: String },
    videoQuality: { type: String, enum: ['1080p', '720p', '480p', '360p'] }
}, { timestamps: true });
exports.StreamingPreferences = (0, mongoose_1.model)('StreamingPreferences', StreamingPreferencesSchema);
//# sourceMappingURL=streamingPreferences.model.js.map