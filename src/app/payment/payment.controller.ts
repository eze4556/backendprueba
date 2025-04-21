import { Router, Request, Response } from 'express';
import PaymentService from './payment.service';

const router = Router();
const paymentService = new PaymentService();

/**
 *Endpoint para autorizar un pago.
 */
router.get('/authorize', async (req, res) => {
  const { metodo, datosTarjeta, monto } = req.query;
  try {
    if (!metodo || !datosTarjeta || !monto) {
      throw new Error('Faltan parámetros requeridos');
    }
    const parsedDatosTarjeta = JSON.parse(datosTarjeta as string);
    const result = await paymentService.authorizePayment(metodo as string, parsedDatosTarjeta, Number(monto));
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * Endpoint para capturar un pago autorizado.
 */
router.get('/capture', async (req: Request, res: Response) => {
  try {
    const { metodo, paymentId, monto } = req.body;
    const result = await paymentService.capturePayment(metodo, paymentId, monto);
    return res.json({ status: 'CAPTURADO', result });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

/**
 * Endpoint para reembolsar un pago.
 */
router.get('/refund', async (req: Request, res: Response) => {
  try {
    const { metodo, paymentId, monto } = req.body;
    const result = await paymentService.refundPayment(metodo, paymentId, monto);
    return res.json({ status: 'REEMBOLSADO', result });
  } catch (err) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

export default router;