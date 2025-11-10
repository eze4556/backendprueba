import { Order } from "../models/order.model";
import { Invoice } from "../../billing/models/invoice.model";
import { AfipService } from "../../billing/services/afip.service"; // Ensure this path is correct
import { Types } from 'mongoose';

export const crearOrdenConFactura = async (data: any) => {
  // 1. Crear la orden
  const order = new Order({
    cliente: data.cliente,
    items: data.items,
    tipo: "producto",
    total: data.items.reduce((acc: number, i: any) => acc + (i.cantidad * i.precioUnitario), 0),
    estado: "pagada"
  });
  await order.save();

  // 2. Generar factura
  const invoice = new Invoice({
    order: order._id,
    numero: Date.now(), // En real, consultar último número de AFIP
    puntoVenta: 1,
    tipoComprobante: 6, // Factura B
    cliente: order.cliente,
    items: order.items,
    total: order.total,
    estado: "pendiente"
  });

  // 3. Llamar a AFIP
  const afipService = new AfipService({CUIT: 20301234562} as any);
  //TODO: Implementar autorizarFactura en AfipService
  const afipResp:any = {cae:"123", fechaVencimiento: "123"}
  //const afipResp = await afipService.autorizarFactura(invoice);
  invoice.cae = afipResp.cae;
  invoice.caeVencimiento = afipResp.fechaVencimiento;
  invoice.estado = "aprobada";
  await invoice.save();
  // 4. Asociar factura a orden
  order.factura = invoice._id as Types.ObjectId;
  await order.save();
  await order.save();

  return { order, invoice };
};
