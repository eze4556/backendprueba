"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoUpload = exports.imageUpload = void 0;
// filepath: src/config/multer.config.ts
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// Configuración mejorada de multer con límites y validaciones
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        // Determinar carpeta según tipo de archivo
        const folder = file.mimetype.startsWith('image/') ? 'uploads/images/' : 'uploads/videos/';
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
        const ext = path_1.default.extname(file.originalname);
        const name = path_1.default.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
});
// Filtro de archivos por tipo MIME
const fileFilter = (req, file, cb) => {
    // Imágenes permitidas
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    // Videos permitidos
    const allowedVideoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
    if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP, GIF) y videos (MP4, MPEG, MOV, AVI)'));
    }
};
// Configuración para imágenes (10MB max)
exports.imageUpload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 5 // Máximo 5 archivos
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten imágenes (JPEG, PNG, WebP, GIF)'));
        }
    }
});
// Configuración para videos (100MB max)
exports.videoUpload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error('Solo se permiten videos (MP4, MPEG, MOV, AVI)'));
        }
    }
});
// Configuración general
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB por defecto
    },
    fileFilter
});
exports.default = upload;
//# sourceMappingURL=multer.config.js.map