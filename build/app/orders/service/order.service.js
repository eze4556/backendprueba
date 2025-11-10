"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearOrdenConFactura = void 0;
const order_model_1 = require("../models/order.model");
const invoice_model_1 = require("../../billing/models/invoice.model");
const afip_service_1 = require("../../billing/services/afip.service"); // Ensure this path is correct
const crearOrdenConFactura = async (data) => {
    // 1. Crear la orden
    const order = new order_model_1.Order({
        cliente: data.cliente,
        items: data.items,
        tipo: "producto",
        total: data.items.reduce((acc, i) => acc + (i.cantidad * i.precioUnitario), 0),
        estado: "pagada"
    });
    await order.save();
    // 2. Generar factura
    const invoice = new invoice_model_1.Invoice({
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
    const afipService = new afip_service_1.AfipService({ CUIT: 20301234562 });
    //TODO: Implementar autorizarFactura en AfipService
    const afipResp = { cae: "123", fechaVencimiento: "123" };
    //const afipResp = await afipService.autorizarFactura(invoice);
    invoice.cae = afipResp.cae;
    invoice.caeVencimiento = afipResp.fechaVencimiento;
    invoice.estado = "aprobada";
    await invoice.save();
    // 4. Asociar factura a orden
    order.factura = invoice._id;
    await order.save();
    await order.save();
    return { order, invoice };
};
exports.crearOrdenConFactura = crearOrdenConFactura;
//# sourceMappingURL=order.service.js.map