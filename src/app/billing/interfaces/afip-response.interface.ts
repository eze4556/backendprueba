// src/app/billing/interfaces/afip-response.interface.ts
export interface AfipResponse {
  cae: string;
  fechaVencimiento: Date;
  resultado: string;
  numeroComprobante: number;
  errores?: AfipError[];
}

export interface AfipError {
  codigo: string;
  descripcion: string;
}

export interface AfipInvoiceRequest {
  puntoVenta: number;
  tipoComprobante: number;
  numero: number;
  fecha: Date;
  importeTotal: number;
  importeNeto: number;
  importeIVA: number;
  documentoTipo: number;
  documentoNro: string;
}