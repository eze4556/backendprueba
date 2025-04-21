"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sharp_1 = __importDefault(require("sharp"));
class ImageTool {
    /**
     * Resize image to thumbnail
     * @param image
     * @returns
     */
    async resize(image) {
        return await (0, sharp_1.default)(image, { failOnError: false }).rotate().withMetadata().resize(200).toBuffer();
    }
}
exports.default = new ImageTool();
