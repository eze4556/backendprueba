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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const token_1 = __importDefault(require("../../../auth/token/token"));
const history_middlewares_1 = __importDefault(require("../../history/middlewares/history.middlewares"));
const UserMiddleware = __importStar(require("../../users/middlewares/user.middlewares"));
const media_controllers_1 = __importDefault(require("../controllers/media.controllers"));
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const MulterMiddleware = {
    picture: (0, multer_1.default)({ limits: { fileSize: 8 * 1024 * 1024 } }).single('data'),
    video: (0, multer_1.default)({ limits: { fileSize: 16 * 1024 * 1024 } }).single('data'),
};
// Helper function to handle errors in middleware
const handleMiddlewareError = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
router.post('/upload/profile_picture', token_1.default.verifyToken, UserMiddleware.checkActive, MulterMiddleware.picture, handleMiddlewareError(history_middlewares_1.default.saveHistory('upload picture')), media_controllers_1.default.uploadProfilePicture); // Upload picture
router.post('/upload/profile_trailer', token_1.default.verifyToken, UserMiddleware.checkActive, MulterMiddleware.video, handleMiddlewareError(history_middlewares_1.default.saveHistory('upload trailer')), media_controllers_1.default.uploadProfileTrailer); // Upload trailer
router.post('/get/profile_picture', token_1.default.verifyToken, UserMiddleware.checkActive, media_controllers_1.default.getProfilePicture); // Get profile picture and thumbnail
router.post('/get/profile_trailer', token_1.default.verifyToken, UserMiddleware.checkActive, media_controllers_1.default.getProfileTrailer); // Get profile trailer
exports.default = router;
