import PDFDocument from 'pdfkit';

interface InvoiceData {
    invoiceId: string;
    customerName: string;
    customerEmail: string;
    eventName: string;
    eventDate: string;
    amount: number;
    transactionId: string;
    paymentDate: string;
}

export const generateInvoicePdf = async (data: InvoiceData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
            });

            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });

            doc.on('end', () => {
                resolve(Buffer.concat(chunks));
            });

            doc.on('error', (error) => {
                reject(error);
            });

            // --- Header & Branding ---
            doc.fontSize(24).font('Helvetica-Bold').fillColor('#2563eb').text('PLANORA', {
                align: 'center',
            });

            doc.moveDown(0.2);
            doc.fontSize(10).font('Helvetica').fillColor('#4b5563').text('Premium Event Management Service', {
                align: 'center',
            });
            doc.text('Plan your moments, we make them reality.', { align: 'center' });

            doc.moveDown(1);

            // Horizontal line
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();

            doc.moveDown(1);

            // --- Invoice Details Section ---
            const startY = doc.y;

            // Invoice Information (Left Side)
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text('Invoice Information', 50, startY);
            doc.fontSize(10).font('Helvetica').fillColor('#374151')
                .text(`Invoice ID: ${data.invoiceId}`)
                .text(`Payment Date: ${new Date(data.paymentDate).toLocaleDateString()}`)
                .text(`Transaction ID: ${data.transactionId}`);

            // Customer Information (Right Side - using text options for positioning)
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text('Customer Details', 350, startY);
            doc.fontSize(10).font('Helvetica').fillColor('#374151')
                .text(`Name: ${data.customerName}`, 350)
                .text(`Email: ${data.customerEmail}`, 350);

            doc.moveDown(1.5);

            // --- Event Details Section ---
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#111827').text('Event Summary', 50);
            doc.fontSize(10).font('Helvetica').fillColor('#374151')
                .text(`Event Name: ${data.eventName}`)
                .text(`Event Date: ${new Date(data.eventDate).toLocaleDateString()}`);

            doc.moveDown(1);

            // --- Payment Table ---
            const tableTop = doc.y;
            const col1X = 50;
            const col2X = 450;

            // Table Header
            doc.rect(50, tableTop, 495, 20).fill('#f3f4f6');
            doc.fontSize(10).font('Helvetica-Bold').fillColor('#111827');
            doc.text('Description', col1X + 10, tableTop + 6);
            doc.text('Amount', col2X, tableTop + 6, { align: 'right' });

            doc.moveDown(1);

            // Amount Row
            const rowY = doc.y + 5;
            doc.fontSize(10).font('Helvetica').fillColor('#374151');
            doc.text(`Booking Fee for ${data.eventName}`, col1X + 10, rowY);
            doc.text(`${data.amount.toFixed(2)} BDT`, col2X, rowY, { align: 'right' });

            doc.moveDown(1);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e5e7eb').stroke();
            doc.moveDown(0.5);

            // Total Row
            const totalY = doc.y;
            doc.fontSize(12).font('Helvetica-Bold').fillColor('#2563eb');
            doc.text('Total Paid', col1X + 10, totalY);
            doc.text(`${data.amount.toFixed(2)} BDT`, col2X, totalY, { align: 'right' });

            doc.moveDown(3);

            // --- Footer ---
            doc.fontSize(9).font('Helvetica').fillColor('#9ca3af').text(
                'Thank you for choosing Planora. We are excited to be part of your event!',
                { align: 'center' }
            );

            doc.moveDown(0.5);
            doc.text('This is an electronically generated invoice. No signature required.', { align: 'center' });
            doc.text('Contact: support@planora.com | Chattogram, Bangladesh', { align: 'center' });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

