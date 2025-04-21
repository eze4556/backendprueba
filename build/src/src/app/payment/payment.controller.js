"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const payment_service_1 = __importDefault(require("./payment.service"));
const router = (0, express_1.Router)();
const paymentService = new payment_service_1.default();
/**
 *Endpoint para autorizar un pago.
 */
router.get('/authorize', async (req, res) => {
    const { metodo, datosTarjeta, monto } = req.query;
    try {
        if (!metodo || !datosTarjeta || !monto) {
            throw new Error('Faltan parámetros requeridos');
        }
        const parsedDatosTarjeta = JSON.parse(datosTarjeta);
        const result = await paymentService.authorizePayment(metodo, parsedDatosTarjeta, Number(monto));
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
/**
 * Endpoint para capturar un pago autorizado.
 */
router.get('/capture', async (req, res) => {
    try {
        const { metodo, paymentId, monto } = req.body;
        const result = await paymentService.capturePayment(metodo, paymentId, monto);
        return res.json({ status: 'CAPTURADO', result });
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
/**
 * Endpoint para reembolsar un pago.
 */
router.get('/refund', async (req, res) => {
    try {
        const { metodo, paymentId, monto } = req.body;
        const result = await paymentService.refundPayment(metodo, paymentId, monto);
        return res.json({ status: 'REEMBOLSADO', result });
    }
    catch (err) {
        return res.status(400).json({ error: err.message });
    }
});
exports.default = router;
