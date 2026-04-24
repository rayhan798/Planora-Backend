import { Request, Response } from "express";
import status from "http-status";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { PaymentService } from "./payment.service";

const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
        console.error("❌ Missing Stripe signature or webhook secret");
        return res.status(status.BAD_REQUEST).json({
            success: false,
            message: "Missing Stripe signature or webhook secret"
        });
    }

    let event;

    try {

        event = stripe.webhooks.constructEvent(
            req.body, 
            signature, 
            webhookSecret
        );
    } catch (error: any) {
        console.error(`❌ Webhook Error: ${error.message}`);
        return res.status(status.BAD_REQUEST).send(`Webhook Error: ${error.message}`);
    }

    try {
        const result = await PaymentService.handlerStripeWebhookEvent(event);

        sendResponse(res, {
            httpStatusCode: status.OK,
            success: true,
            message: "Planora: Stripe webhook event processed successfully",
            data: result
        });
    } catch (error: any) {
        console.error("❌ Error handling Stripe webhook event:", error);
        sendResponse(res, {
            httpStatusCode: status.INTERNAL_SERVER_ERROR,
            success: false,
            message: error?.message || "Internal Server Error in handling webhook",
            data: null
        });
    }
});

export const PaymentController = {
    handleStripeWebhookEvent
};