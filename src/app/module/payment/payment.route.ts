import express from 'express';
import { PaymentController } from './payment.controller';

const router = express.Router();

router.post(
    '/webhook',
    express.raw({ type: 'application/json' }), 
    PaymentController.handleStripeWebhookEvent
);

export const PaymentRoutes = router;