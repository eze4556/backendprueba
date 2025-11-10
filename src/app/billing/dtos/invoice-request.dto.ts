export class InvoiceRequestDto {
  customerId!: string;
  items!: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
  }>;
  invoiceType!: string;
  pointOfSale!: string;
}