
import { IsString, IsNumber, IsOptional, IsDateString, IsEnum } from 'class-validator';

export class CreateInvoiceDto {
  @IsNumber()
  numero!: number;

  @IsNumber()
  puntoVenta!: number;

  @IsNumber()
  tipoComprobante!: number;

  @IsString()
  providerId!: string;

  @IsString()
  subscriptionMonth!: string;

  @IsEnum(['bronce', 'plata', 'gold'])
  plan!: 'bronce' | 'plata' | 'gold';

  @IsNumber()
  @IsOptional()
  total?: number;
}

export class InvoiceResponseDto {
  @IsString()
  id: string = '';

  @IsString()
  invoiceNumber: string = '';

  @IsString()
  @IsOptional()
  cae?: string;

  @IsDateString()
  @IsOptional()
  caeExpiration?: string;

  @IsNumber()
  total: number = 0;

  @IsString()
  status: string = '';

  @IsString()
  @IsOptional()
  pdfUrl?: string;

  @IsString()
  subscriptionMonth: string = '';

  @IsString()
  plan: 'bronce' | 'plata' | 'gold' = 'bronce';
}