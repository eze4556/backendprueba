"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RandomTool {
    /**
     * Generate a randon link of 40 characters
     * @returns
     */
    generateLink() {
        let text = '';
        const shuffle = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 50; i++)
            text += shuffle.charAt(Math.floor(Math.random() * shuffle.length));
        return text;
    }
}
exports.default = new RandomTool();
