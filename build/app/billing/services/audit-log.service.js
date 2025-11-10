"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogService = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class AuditLogService {
    constructor() {
        this.logPath = (0, path_1.join)(__dirname, '../../../../logs/audit.log');
    }
    log(message, data) {
        const entry = `[${new Date().toISOString()}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
        (0, fs_1.appendFileSync)(this.logPath, entry);
    }
    error(message, data) {
        const entry = `[${new Date().toISOString()}] ERROR: ${message} ${data ? JSON.stringify(data) : ''}\n`;
        (0, fs_1.appendFileSync)(this.logPath, entry);
    }
}
exports.AuditLogService = AuditLogService;
//# sourceMappingURL=audit-log.service.js.map