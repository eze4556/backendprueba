import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createReadStream } from 'fs';
import { join } from 'path';

export class StorageService {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });
    this.bucket = process.env.AWS_S3_BUCKET || '';
  }

  async uploadInvoicePdf(invoiceId: string, pdfBuffer: Buffer): Promise<string> {
    const key = `invoices/${invoiceId}.pdf`;
    if (!this.bucket) throw new Error('S3 bucket no configurado');
    
    const command = new PutObjectCommand({
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
    } catch (error: any) {
      throw new Error(`Error uploading PDF to S3: ${error?.message || 'Unknown error'}`);
    }
  }

  async getSignedUrl(invoiceId: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: `invoices/${invoiceId}.pdf`,
    });

    try {
      // AWS SDK v3 utiliza getSignedUrl de @aws-sdk/s3-request-presigner
      return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    } catch (error: any) {
      throw new Error(`Error generating signed URL: ${error?.message || 'Unknown error'}`);
    }
  }

  async deleteInvoicePdf(invoiceId: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: `invoices/${invoiceId}.pdf`
    });

    try {
      await this.s3Client.send(command);
    } catch (error: any) {
      throw new Error(`Error deleting PDF from S3: ${error?.message || 'Unknown error'}`);
    }
  }

  async createBackup(date: string): Promise<string> {
    const backupKey = `backups/invoices-${date}.zip`;
    
    try {
      // Aquí podrías implementar la lógica para crear un ZIP con todas las facturas
      // del día y subirlo como backup
      
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: backupKey,
        // Body: zipBuffer,
        ContentType: 'application/zip'
      });

      const result = await this.s3Client.send(command);
      // En AWS SDK v3, construimos la URL manualmente
      const location = `https://${this.bucket}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${backupKey}`;
      return location;
    } catch (error: any) {
      throw new Error(`Error creating backup: ${error?.message || 'Unknown error'}`);
    }
  }
}