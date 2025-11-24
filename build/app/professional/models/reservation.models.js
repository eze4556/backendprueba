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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
var ReservationStatus;
(function (ReservationStatus) {
    ReservationStatus["PENDING"] = "pending";
    ReservationStatus["CONFIRMED"] = "confirmed";
    ReservationStatus["CANCELLED"] = "cancelled";
    ReservationStatus["COMPLETED"] = "completed";
    ReservationStatus["NO_SHOW"] = "no_show";
})(ReservationStatus || (exports.ReservationStatus = ReservationStatus = {}));
const ReservationSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    professionalId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Professional',
        required: true,
        index: true
    },
    serviceType: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    duration: {
        type: Number,
        required: true,
        min: 15,
        max: 480 // máximo 8 horas
    },
    status: {
        type: String,
        enum: Object.values(ReservationStatus),
        default: ReservationStatus.PENDING
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    notes: {
        type: String,
        maxlength: 500
    },
    cancellationReason: {
        type: String,
        maxlength: 500
    },
    reminderSent24h: {
        type: Boolean,
        default: false
    },
    reminderSent1h: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// Índice compuesto para consultas de disponibilidad
ReservationSchema.index({ professionalId: 1, date: 1, status: 1 });
exports.default = mongoose_1.default.model('Reservation', ReservationSchema);
//# sourceMappingURL=reservation.models.js.map