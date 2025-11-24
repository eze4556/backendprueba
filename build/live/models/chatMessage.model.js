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
exports.MessageType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Enum para tipos de mensaje
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["SYSTEM"] = "system";
    MessageType["EMOJI"] = "emoji";
    MessageType["GIFT"] = "gift";
})(MessageType || (exports.MessageType = MessageType = {}));
// Schema de Mongoose
const ChatMessageSchema = new mongoose_1.Schema({
    streamId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    userRole: {
        type: String
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    messageType: {
        type: String,
        enum: Object.values(MessageType),
        default: MessageType.TEXT
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    metadata: {
        giftValue: {
            type: Number
        },
        emojiCode: {
            type: String
        },
        replyTo: {
            type: String
        }
    }
}, {
    timestamps: true,
    collection: 'chatMessages'
});
// Índices compuestos para consultas eficientes
ChatMessageSchema.index({ streamId: 1, timestamp: -1 });
ChatMessageSchema.index({ userId: 1, streamId: 1 });
exports.default = mongoose_1.default.model('ChatMessage', ChatMessageSchema);
//# sourceMappingURL=chatMessage.model.js.map