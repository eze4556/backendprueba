import { writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';

export class AuditLogService {
  private logPath: string;

  constructor() {
    this.logPath = join(__dirname, '../../../../logs/audit.log');
  }

  log(message: string, data?: any) {
    const entry = `[${new Date().toISOString()}] ${message} ${data ? JSON.stringify(data) : ''}\n`;
    appendFileSync(this.logPath, entry);
  }

  error(message: string, data?: any) {
    const entry = `[${new Date().toISOString()}] ERROR: ${message} ${data ? JSON.stringify(data) : ''}\n`;
    appendFileSync(this.logPath, entry);
  }
}
