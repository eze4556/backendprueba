"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const TimeSlotSchema = new mongoose_1.Schema({
    start: {
        type: String,
        required: true,
        match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/ // HH:mm format
    },
    end: {
        type: String,
        required: true,
        match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, { _id: false });
const DayAvailabilitySchema = new mongoose_1.Schema({
    dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6
    },
    isWorking: {
        type: Boolean,
        default: true
    },
    slots: [TimeSlotSchema]
}, { _id: false });
const AvailabilitySchema = new mongoose_1.Schema({
    professionalId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Professional',
        required: true,
        unique: true,
        index: true
    },
    timezone: {
        type: String,
        required: true,
        default: 'America/Argentina/Buenos_Aires'
    },
    schedule: {
        type: [DayAvailabilitySchema],
        required: true,
        validate: {
            validator: function (schedule) {
                return schedule.length === 7;
            },
            message: 'Schedule must have 7 days'
        }
    },
    blockedDates: {
        type: [Date],
        default: []
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.model('Availability', AvailabilitySchema);
//# sourceMappingURL=availability.models.js.map