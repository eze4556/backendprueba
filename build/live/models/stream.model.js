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
exports.StreamQuality = exports.StreamStatus = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Enum para el estado del stream
var StreamStatus;
(function (StreamStatus) {
    StreamStatus["WAITING"] = "waiting";
    StreamStatus["LIVE"] = "live";
    StreamStatus["ENDED"] = "ended";
    StreamStatus["PAUSED"] = "paused";
})(StreamStatus || (exports.StreamStatus = StreamStatus = {}));
// Enum para la calidad del stream
var StreamQuality;
(function (StreamQuality) {
    StreamQuality["LOW"] = "480p";
    StreamQuality["MEDIUM"] = "720p";
    StreamQuality["HIGH"] = "1080p";
    StreamQuality["ULTRA"] = "4K";
})(StreamQuality || (exports.StreamQuality = StreamQuality = {}));
// Schema de Mongoose
const StreamSchema = new mongoose_1.Schema({
    streamId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    description: {
        type: String,
        maxlength: 1000
    },
    streamer: {
        userId: {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        username: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        enum: Object.values(StreamStatus),
        default: StreamStatus.WAITING
    },
    quality: {
        type: String,
        enum: Object.values(StreamQuality),
        default: StreamQuality.MEDIUM
    },
    viewers: [{
            userId: {
                type: String,
                required: true
            },
            username: {
                type: String,
                required: true
            },
            joinedAt: {
                type: Date,
                default: Date.now
            },
            socketId: {
                type: String,
                required: true
            },
            isActive: {
                type: Boolean,
                default: true
            }
        }],
    viewerCount: {
        type: Number,
        default: 0
    },
    maxViewers: {
        type: Number,
        default: 1000
    },
    startedAt: {
        type: Date
    },
    endedAt: {
        type: Date
    },
    duration: {
        type: Number,
        default: 0
    },
    thumbnailUrl: {
        type: String
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    allowedViewers: [{
            type: String
        }],
    tags: [{
            type: String,
            maxlength: 50
        }],
    category: {
        type: String
    },
    role: {
        type: String
    },
    product: {
        type: String
    },
    productType: {
        type: String
    },
    productStatus: {
        type: String
    },
    location: {
        type: String,
        index: true
    },
    metadata: {
        totalViews: {
            type: Number,
            default: 0
        },
        peakViewers: {
            type: Number,
            default: 0
        },
        averageViewTime: {
            type: Number,
            default: 0
        },
        chatEnabled: {
            type: Boolean,
            default: true
        },
        recordingEnabled: {
            type: Boolean,
            default: false
        }
    },
    webrtc: {
        roomId: {
            type: String,
            required: true
        },
        signalData: {
            type: mongoose_1.Schema.Types.Mixed
        }
    }
}, {
    timestamps: true,
    collection: 'streams'
});
// Índices para mejorar el rendimiento de consultas
StreamSchema.index({ 'streamer.userId': 1 });
StreamSchema.index({ status: 1 });
StreamSchema.index({ createdAt: -1 });
StreamSchema.index({ viewerCount: -1 });
StreamSchema.index({ category: 1, status: 1 });
StreamSchema.index({ role: 1 });
StreamSchema.index({ product: 1 });
StreamSchema.index({ productType: 1 });
StreamSchema.index({ productStatus: 1 });
StreamSchema.index({ location: 1 });
// Método para agregar un viewer
StreamSchema.methods.addViewer = async function (viewerData) {
    // Verificar si el viewer ya existe
    const existingViewer = this.viewers.find((v) => v.userId === viewerData.userId);
    if (!existingViewer) {
        this.viewers.push(viewerData);
        this.viewerCount = this.viewers.filter((v) => v.isActive).length;
        // Actualizar estadísticas
        this.metadata.totalViews++;
        if (this.viewerCount > this.metadata.peakViewers) {
            this.metadata.peakViewers = this.viewerCount;
        }
        await this.save();
    }
    return this;
};
// Método para remover un viewer
StreamSchema.methods.removeViewer = async function (userId) {
    const viewerIndex = this.viewers.findIndex((v) => v.userId === userId);
    if (viewerIndex !== -1) {
        this.viewers[viewerIndex].isActive = false;
        this.viewerCount = this.viewers.filter((v) => v.isActive).length;
        await this.save();
    }
    return this;
};
// Método para iniciar el stream
StreamSchema.methods.startStream = async function () {
    this.status = StreamStatus.LIVE;
    this.startedAt = new Date();
    await this.save();
    return this;
};
// Método para finalizar el stream
StreamSchema.methods.endStream = async function () {
    this.status = StreamStatus.ENDED;
    this.endedAt = new Date();
    if (this.startedAt) {
        this.duration = Math.floor((this.endedAt.getTime() - this.startedAt.getTime()) / 1000);
    }
    // Calcular tiempo promedio de visualización
    const activeViewers = this.viewers.filter((v) => v.isActive);
    if (activeViewers.length > 0 && this.duration > 0) {
        this.metadata.averageViewTime = Math.floor(this.duration / activeViewers.length);
    }
    await this.save();
    return this;
};
exports.default = mongoose_1.default.model('Stream', StreamSchema);
//# sourceMappingURL=stream.model.js.map