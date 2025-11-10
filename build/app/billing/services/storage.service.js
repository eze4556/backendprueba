"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
class StorageService {
    constructor() {
        this.s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });
        this.bucket = process.env.AWS_S3_BUCKET || '';
    }
    async uploadInvoicePdf(invoiceId, pdfBuffer) {
        const key = `invoices/${invoiceId}.pdf`;
        if (!this.bucket)
            throw new Error('S3 bucket no configurado');
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ACL: 'private',
            Metadata: {
                'Content-Type': 'application/pdf',
                'Created-Date': new Date().toISOString()
            }
        });
        try {
            const result = await this.s3Client.send(command);
            // En AWS SDK v3, construimos la URL manualmente
            const location = `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
            return location;
        }
        catch (error) {
            throw new Error(`Error uploading PDF to S3: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
        }
    }
    async getSignedUrl(invoiceId) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucket,
            Key: `invoices/${invoiceId}.pdf`,
        });
        try {
            // AWS SDK v3 utiliza getSignedUrl de @aws-sdk/s3-request-presigner
            return await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn: 3600 });
        }
        catch (error) {
            throw new Error(`Error generating signed URL: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
        }
    }
    async deleteInvoicePdf(invoiceId) {
        const command = new client_s3_1.DeleteObjectCommand({
            Bucket: this.bucket,
            Key: `invoices/${invoiceId}.pdf`
        });
        try {
            await this.s3Client.send(command);
        }
        catch (error) {
            throw new Error(`Error deleting PDF from S3: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
        }
    }
    async createBackup(date) {
        const backupKey = `backups/invoices-${date}.zip`;
        try {
            // Aquí podrías implementar la lógica para crear un ZIP con todas las facturas
            // del día y subirlo como backup
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: backupKey,
                // Body: zipBuffer,
                ContentType: 'application/zip'
            });
            const result = await this.s3Client.send(command);
            // En AWS SDK v3, construimos la URL manualmente
            const location = `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${backupKey}`;
            return location;
        }
        catch (error) {
            throw new Error(`Error creating backup: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
        }
    }
}
exports.StorageService = StorageService;
//# sourceMappingURL=storage.service.js.map