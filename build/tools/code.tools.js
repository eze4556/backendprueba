"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CodeTool {
    /**
     * Generate aleatory code (6)
     * @returns
     */
    generateCode() {
        let text = '';
        const shuffle = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 6; i++)
            text += shuffle.charAt(Math.floor(Math.random() * shuffle.length));
        return text; // Return a 6 digits random code
    }
}
exports.default = new CodeTool();
//# sourceMappingURL=code.tools.js.map