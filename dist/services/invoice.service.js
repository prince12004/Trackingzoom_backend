"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamInvoicePdf = streamInvoicePdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const Setting_1 = require("../models/Setting");
async function streamInvoicePdf(order, res) {
    const settings = await (0, Setting_1.getSettings)();
    const doc = new pdfkit_1.default({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.orderNumber}.pdf`);
    doc.pipe(res);
    doc.fontSize(20).text(settings.general.companyName || 'TrackingZoom GPS', { align: 'left' });
    doc.fontSize(9).fillColor('#555').text(settings.general.address || '', { align: 'left' });
    if (settings.business.gstNumber)
        doc.text(`GSTIN: ${settings.business.gstNumber}`);
    doc.moveDown();
    doc.fillColor('#000').fontSize(14).text('TAX INVOICE', { align: 'right' });
    doc.fontSize(10).text(`Invoice No: ${order.invoiceNumber || '-'}`, { align: 'right' });
    doc.text(`Order No: ${order.orderNumber}`, { align: 'right' });
    doc.text(`Date: ${new Date(order.placedAt).toLocaleDateString('en-IN')}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(11).text('Bill To:', { underline: true });
    doc.fontSize(10).text(order.billingAddress.name);
    doc.text(order.billingAddress.mobile);
    doc.text(`${order.billingAddress.addressLine1}${order.billingAddress.addressLine2 ? ', ' + order.billingAddress.addressLine2 : ''}`);
    doc.text(`${order.billingAddress.city}, ${order.billingAddress.state} - ${order.billingAddress.pincode}`);
    doc.moveDown();
    const tableTop = doc.y;
    const cols = { name: 50, qty: 280, price: 340, tax: 410, total: 480 };
    doc.fontSize(10).text('Item', cols.name, tableTop);
    doc.text('Qty', cols.qty, tableTop);
    doc.text('Price', cols.price, tableTop);
    doc.text('Tax', cols.tax, tableTop);
    doc.text('Total', cols.total, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).stroke();
    let y = tableTop + 22;
    order.items.forEach((item) => {
        doc.fontSize(9).text(`${item.name} (${item.sku})`, cols.name, y, { width: 220 });
        doc.text(String(item.quantity), cols.qty, y);
        doc.text(`Rs.${item.price.toFixed(2)}`, cols.price, y);
        doc.text(`Rs.${item.taxAmount.toFixed(2)}`, cols.tax, y);
        doc.text(`Rs.${item.lineTotal.toFixed(2)}`, cols.total, y);
        y += 20;
    });
    doc.moveTo(50, y + 5).lineTo(545, y + 5).stroke();
    y += 15;
    const summaryLine = (label, value) => {
        doc.fontSize(10).text(label, 380, y);
        doc.text(`Rs.${value.toFixed(2)}`, cols.total, y);
        y += 16;
    };
    summaryLine('Subtotal', order.subtotal);
    summaryLine('Discount', -order.discountAmount);
    summaryLine('Tax (GST)', order.taxAmount);
    summaryLine('Shipping', order.shippingCharge);
    if (order.codCharge)
        summaryLine('COD Charge', order.codCharge);
    doc.fontSize(12).text('Grand Total', 380, y, { continued: false });
    doc.text(`Rs.${order.totalAmount.toFixed(2)}`, cols.total, y);
    y += 25;
    doc.fontSize(9).fillColor('#555').text(`Payment Method: ${order.paymentMethod.toUpperCase()}`, 50, y);
    doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 50, y + 14);
    if (order.ewayBillNumber)
        doc.text(`E-Way Bill: ${order.ewayBillNumber}`, 50, y + 28);
    doc.moveDown(3);
    doc.fontSize(8).fillColor('#888').text('This is a computer-generated invoice and does not require a signature.', { align: 'center' });
    doc.end();
}
//# sourceMappingURL=invoice.service.js.map