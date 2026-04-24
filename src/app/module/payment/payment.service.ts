import Stripe from "stripe";
import { uploadFileToCloudinary } from "../../config/cloudinary.config";
import { prisma } from "../../lib/prisma"; 
import { sendEmail } from "../../utils/email";
import { generateInvoicePdf } from "./payment.utils";

const handlerStripeWebhookEvent = async (event: Stripe.Event) => {
    if (!prisma) {
        console.error("❌ Prisma instance not found!");
        return { message: "Internal Server Error" };
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;

            const rawInviteId = session.metadata?.inviteId || session.metadata?.bookingId;
            const rawPaymentId = session.metadata?.paymentId; 
            const rawUserId = session.metadata?.userId;

            if (!rawInviteId || !rawPaymentId) {
                console.error("⚠️ Webhook Error: Missing metadata in Stripe session.");
                return { message: "Missing metadata" };
            }

            try {
                const targetId = parseInt(rawInviteId.toString(), 10);
                const userId = rawUserId ? parseInt(rawUserId.toString(), 10) : null;

                let invitation = await (prisma as any).invitation.findUnique({
                    where: { id: targetId },
                    include: { receiver: true, event: true }
                });

                if (!invitation && userId) {
                    console.log(`🔍 Searching invitation by Event ID: ${targetId} for User: ${userId}`);
                    invitation = await (prisma as any).invitation.findFirst({
                        where: { 
                            eventId: targetId,
                            receiverId: userId 
                        },
                        include: { receiver: true, event: true }
                    });
                }

                if (!invitation) {
                    console.error(`❌ No invitation found for ID ${targetId}`);
                    return { message: "Invitation not found" };
                }

                const result = await prisma.$transaction(async (tx) => {

                    await (tx as any).invitation.update({
                        where: { id: invitation.id },
                        data: { status: "ACCEPTED" }
                    });

                    await (tx as any).event.update({
                        where: { id: invitation.eventId },
                        data: { bookedSeats: { increment: 1 } }
                    });

                    let invoiceUrl = null;
                    try {
                        const pdfBuffer = await generateInvoicePdf({
                            invoiceId: rawPaymentId, 
                            customerName: invitation.receiver.name,
                            customerEmail: invitation.receiver.email,
                            eventName: invitation.event.title,
                            eventDate: invitation.event.date.toString(),
                            amount: Number(session.amount_total) / 100,
                            transactionId: session.payment_intent as string || rawPaymentId,
                            paymentDate: new Date().toISOString()
                        });

                        const cloudinaryResponse = await uploadFileToCloudinary(
                            pdfBuffer,
                            `planora/invoices/invoice-${rawPaymentId}.pdf`
                        );
                        invoiceUrl = cloudinaryResponse?.secure_url;
                    } catch (pdfErr) {
                        console.error("❌ PDF/Cloudinary Error:", pdfErr);
                    }

                
                    const updatedPayment = await (tx as any).payment.upsert({
                        where: { 
                            transactionId: rawPaymentId 
                        },
                        update: {
                            status: session.payment_status === "paid" ? "SUCCESS" : "PENDING",
                            invoiceUrl: invoiceUrl,
                            paymentGatewayData: session as any
                        },
                        create: {
                            transactionId: rawPaymentId,
                            amount: Number(session.amount_total) / 100,
                            userId: invitation.receiverId,
                            eventId: invitation.eventId,
                            creatorId: invitation.creatorId,
                            method: "STRIPE", 
                            status: session.payment_status === "paid" ? "SUCCESS" : "PENDING",
                            invoiceUrl: invoiceUrl,
                            paymentGatewayData: session as any
                        }
                    });

                    return { updatedPayment, invoiceUrl };
                });

                
                if (session.payment_status === "paid" && result.invoiceUrl) {
                    await sendEmail({
                        to: invitation.receiver.email,
                        subject: `Payment Confirmed: ${invitation.event.title}`,
                        templateName: "invoice",
                        templateData: {
                            customerName: invitation.receiver.name,
                            eventName: invitation.event.title,
                            invoiceUrl: result.invoiceUrl
                        }
                    });
                }

                console.log(`✅ Webhook Success: Invitation ${invitation.id} and Payment ${rawPaymentId} updated.`);

            } catch (error: any) {
                console.error("❌ Webhook Transaction Error:", error.message);
            }
            break;
        }

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    return { message: "Processed" };
};

export const PaymentService = {
    handlerStripeWebhookEvent
};