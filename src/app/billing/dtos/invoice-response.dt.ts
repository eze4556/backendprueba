export class InvoiceResponseDto {
  id!: string;
  invoiceNumber!: string;
  cae!: string;
  caeExpiration!: Date;
  total!: number;
  status!: string;
  pdfUrl?: string;
}