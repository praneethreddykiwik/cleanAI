import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../middleware/auth';
import { PaymentsService } from './payments.service';

export const paymentsRoutes = Router();

// Create payment checkout order
paymentsRoutes.post('/order', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId, amount } = req.body;
    if (!bookingId || !amount) {
      return res.status(400).json({ success: false, message: 'Missing bookingId or amount.' });
    }

    const orderData = await PaymentsService.createOrder(bookingId, parseFloat(amount.toString()));
    res.status(201).json(orderData);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to initialize payment checkout.' });
  }
});

// Verify gateway signature webhook/callback
paymentsRoutes.post('/verify', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId, orderId, paymentId, signature } = req.body;
    if (!bookingId || !orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, message: 'Missing verification attributes.' });
    }

    const isValid = await PaymentsService.verifySignature(bookingId, orderId, paymentId, signature);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid signature. Capture failed.' });
    }

    res.status(200).json({ success: true, message: 'Payment successfully captured and verified.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Signature verification failed.' });
  }
});

// Initiate payment refund
paymentsRoutes.post('/:id/refund', authMiddleware as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, reason = 'Customer request' } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Please specify a refund amount.' });
    }

    const isRefunded = await PaymentsService.refundPayment(id, parseFloat(amount.toString()), reason);
    if (!isRefunded) {
      return res.status(400).json({ success: false, message: 'Refund failed at gateway.' });
    }

    res.status(200).json({ success: true, message: 'Refund successfully processed.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Refund processing failed.' });
  }
});

export default paymentsRoutes;
