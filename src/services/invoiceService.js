/**
 * GoMate PDF Invoice & Receipt Generator
 * Generates bilingual (Marathi + English) professional PDF invoices
 * for machinery rental bookings — with UPI QR, GoMate guarantee stamp,
 * and itemised cost breakdown.
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// Ensure invoices directory exists
const INVOICES_DIR = path.join(__dirname, '../../public/invoices');
if (!fs.existsSync(INVOICES_DIR)) {
  fs.mkdirSync(INVOICES_DIR, { recursive: true });
}

/**
 * Brand colours & layout constants
 */
const BRAND = {
  green: '#16A34A',
  darkGreen: '#14532D',
  orange: '#D97706',
  slate: '#0F172A',
  slateLight: '#334155',
  gray: '#64748B',
  grayLight: '#F1F5F9',
  red: '#DC2626',
  white: '#FFFFFF',
  lineColor: '#E2E8F0',
};

/**
 * Generate a PDF invoice Buffer for a booking
 * @param {object} booking - Booking record
 * @returns {Promise<Buffer>} - PDF buffer
 */
function generateInvoicePDF(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 0,
        info: {
          Title: `GoMate Invoice ${booking.booking_ref}`,
          Author: 'GoMate AgriTech Platform',
          Subject: 'Machinery Rental Invoice',
        }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = 595.28; // A4 width in points
      const M = 40;     // Side margin

      // ─── HEADER BLOCK ────────────────────────────────────────────────────
      // Green top bar
      doc.rect(0, 0, W, 90).fill(BRAND.green);

      // GoMate logo text
      doc.fillColor(BRAND.white)
         .font('Helvetica-Bold')
         .fontSize(26)
         .text('GoMate', M, 22, { continued: true })
         .font('Helvetica')
         .fontSize(13)
         .fillColor('#BBF7D0')
         .text('  •  शेतीसाठी मशिनरी भाडे सेवा');

      doc.fillColor('#D1FAE5')
         .font('Helvetica')
         .fontSize(10)
         .text('Jath Taluka, Sangli District, Maharashtra — 416404', M, 52);

      doc.fillColor('#D1FAE5')
         .fontSize(9)
         .text('📞 +91 98220 12345   |   🌐 gomate.in   |   ✉ support@gomate.in', M, 68);

      // INVOICE label on right
      doc.fillColor(BRAND.white)
         .font('Helvetica-Bold')
         .fontSize(22)
         .text('INVOICE', W - M - 110, 24, { width: 110, align: 'right' });

      doc.fillColor('#BBF7D0')
         .font('Helvetica')
         .fontSize(9)
         .text('TAX INVOICE / पावती', W - M - 110, 52, { width: 110, align: 'right' });

      // ─── BOOKING REF BANNER ──────────────────────────────────────────────
      doc.rect(0, 90, W, 38).fill(BRAND.slate);

      doc.fillColor(BRAND.white)
         .font('Helvetica-Bold')
         .fontSize(11)
         .text(`Booking Ref: ${booking.booking_ref || 'GM-XXXX'}`, M, 103, { continued: true });

      doc.fillColor('#94A3B8')
         .font('Helvetica')
         .fontSize(10)
         .text(`   |   Date: ${new Date(booking.created_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, { continued: true });

      const statusColor = booking.status === 'confirmed' ? '#4ADE80' :
                          booking.status === 'completed' ? '#34D399' : '#FCD34D';
      doc.fillColor(statusColor)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text(`   |   Status: ${(booking.status || 'CONFIRMED').toUpperCase()}`);

      let y = 148;

      // ─── BILLING PARTIES ─────────────────────────────────────────────────
      // Customer (left)
      doc.fillColor(BRAND.slateLight)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('BILLED TO (शेतकरी / Customer)', M, y);

      doc.fillColor(BRAND.slate)
         .font('Helvetica-Bold')
         .fontSize(13)
         .text(booking.customer_name || 'Farmer Customer', M, y + 14);

      doc.fillColor(BRAND.gray)
         .font('Helvetica')
         .fontSize(10)
         .text(`📱 ${booking.customer_phone || '+91 XXXXXXXXXX'}`, M, y + 32)
         .text(`📍 ${booking.village || 'Jath Taluka'}, Sangli`, M, y + 46);

      // Owner / Service Provider (right)
      const rightX = W / 2 + 10;
      doc.fillColor(BRAND.slateLight)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('SERVICE PROVIDER (मशिनरी मालक)', rightX, y);

      doc.fillColor(BRAND.slate)
         .font('Helvetica-Bold')
         .fontSize(13)
         .text(booking.owner_name || 'Rajesh Patil', rightX, y + 14);

      doc.fillColor(BRAND.gray)
         .font('Helvetica')
         .fontSize(10)
         .text(`📱 ${booking.owner_phone || '+91 98220 12345'}`, rightX, y + 32)
         .text(`🚜 GoMate Verified Owner Pro ✓`, rightX, y + 46);

      // Divider
      y += 80;
      doc.moveTo(M, y).lineTo(W - M, y).strokeColor(BRAND.lineColor).lineWidth(1).stroke();
      y += 14;

      // ─── EQUIPMENT & SERVICE DETAILS ─────────────────────────────────────
      doc.fillColor(BRAND.slateLight)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('MACHINERY & SERVICE DETAILS (मशिनरी व सेवा तपशील)', M, y);

      y += 14;
      doc.rect(M, y, W - M * 2, 58).fill(BRAND.grayLight).stroke(BRAND.lineColor);

      doc.fillColor(BRAND.slate)
         .font('Helvetica-Bold')
         .fontSize(12)
         .text(booking.equipment_name || 'Mahindra 575 DI (45 HP) Tractor', M + 12, y + 10);

      const attachment = booking.attachment || 'Rotavator (6-ft)';
      const hours = booking.hours_booked || booking.duration_hours || 6;
      const village = booking.village || 'Shegaon';
      const workDate = new Date(booking.work_date || booking.created_at || Date.now())
                         .toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      doc.fillColor(BRAND.gray)
         .font('Helvetica')
         .fontSize(10)
         .text(`Attachment / अवजार: ${attachment}   |   Work Date: ${workDate}`, M + 12, y + 28)
         .text(`Work Location: ${village}, Jath Taluka   |   Duration: ${hours} Hours`, M + 12, y + 42);

      y += 74;

      // ─── COST BREAKDOWN TABLE ─────────────────────────────────────────────
      doc.fillColor(BRAND.slateLight)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('ITEMISED COST BREAKDOWN (खर्चाचा तपशील)', M, y);

      y += 12;

      // Table header
      doc.rect(M, y, W - M * 2, 24).fill(BRAND.slate);
      doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(9);
      doc.text('Description', M + 10, y + 8, { width: 230 });
      doc.text('Qty / Hrs', M + 250, y + 8, { width: 80, align: 'center' });
      doc.text('Rate (₹)', M + 340, y + 8, { width: 80, align: 'right' });
      doc.text('Amount (₹)', M + 420, y + 8, { width: W - M * 2 - 420, align: 'right' });

      y += 24;

      const hourlyRate = booking.hourly_rate || 800;
      const grossAmount = hourlyRate * hours;
      const platformFee = Math.round(grossAmount * 0.08); // 8% platform fee
      const gstOnFee = Math.round(platformFee * 0.18);   // 18% GST on platform fee
      const totalAmount = grossAmount + platformFee + gstOnFee;

      const lineItems = [
        { desc: `${booking.equipment_name || 'Tractor'} — Rental Charges`, descMr: 'यंत्र भाडे शुल्क', qty: `${hours} hrs`, rate: hourlyRate, amount: grossAmount },
        { desc: attachment, descMr: 'अवजार व ऑपरेटर', qty: `${hours} hrs`, rate: 0, amount: 0, note: 'Included' },
        { desc: 'GoMate Platform Service Fee (8%)', descMr: 'सेवा शुल्क', qty: '—', rate: 0, amount: platformFee },
        { desc: 'GST @ 18% on Service Fee', descMr: 'जीएसटी', qty: '—', rate: 0, amount: gstOnFee },
      ];

      lineItems.forEach((item, idx) => {
        const rowY = y + idx * 26;
        if (idx % 2 === 0) {
          doc.rect(M, rowY, W - M * 2, 26).fill('#F8FAFC').stroke(BRAND.lineColor);
        } else {
          doc.rect(M, rowY, W - M * 2, 26).fill(BRAND.white).stroke(BRAND.lineColor);
        }

        doc.fillColor(BRAND.slate).font('Helvetica').fontSize(9)
           .text(item.desc, M + 10, rowY + 8, { width: 230 });
        doc.fillColor(BRAND.gray).fontSize(8)
           .text(item.descMr, M + 10, rowY + 18, { width: 230 });

        doc.fillColor(BRAND.slateLight).font('Helvetica').fontSize(10)
           .text(item.note || item.qty, M + 250, rowY + 9, { width: 80, align: 'center' });

        if (item.rate > 0) {
          doc.fillColor(BRAND.slateLight).font('Helvetica').fontSize(10)
             .text(`₹${item.rate.toLocaleString('en-IN')}`, M + 340, rowY + 9, { width: 80, align: 'right' });
        }

        const amtStr = item.note ? 'INCLUDED' : `₹${item.amount.toLocaleString('en-IN')}`;
        doc.fillColor(item.note ? BRAND.green : BRAND.slate).font('Helvetica-Bold').fontSize(10)
           .text(amtStr, M + 420, rowY + 9, { width: W - M * 2 - 420, align: 'right' });
      });

      y += lineItems.length * 26 + 2;

      // Total Row
      doc.rect(M, y, W - M * 2, 34).fill(BRAND.slate);
      doc.fillColor(BRAND.white)
         .font('Helvetica-Bold')
         .fontSize(13)
         .text('TOTAL AMOUNT DUE', M + 10, y + 10, { width: 300 });
      doc.fillColor('#4ADE80')
         .font('Helvetica-Bold')
         .fontSize(15)
         .text(`₹${totalAmount.toLocaleString('en-IN')}`, M + 310, y + 9, { width: W - M * 2 - 320, align: 'right' });

      y += 50;

      // ─── PAYMENT & GUARANTEE SECTION ─────────────────────────────────────
      // Left: Payment info
      doc.fillColor(BRAND.slateLight)
         .font('Helvetica-Bold')
         .fontSize(9)
         .text('PAYMENT METHOD (पेमेंट)', M, y);

      doc.fillColor(BRAND.slate)
         .font('Helvetica')
         .fontSize(10)
         .text('UPI: gomate@upi', M, y + 14)
         .text('GPay / PhonePe / Paytm accepted', M, y + 28)
         .text('A/C: 1234567890  •  IFSC: HDFC0001234', M, y + 42);

      // Right: GoMate Guarantee Box
      const gBoxX = W / 2 + 10;
      doc.rect(gBoxX, y, W - M - gBoxX, 80).fill('#F0FDF4').stroke(BRAND.green);

      doc.fillColor(BRAND.darkGreen)
         .font('Helvetica-Bold')
         .fontSize(10)
         .text('✅ GoMate Quality Guarantee', gBoxX + 10, y + 10);

      doc.fillColor(BRAND.slateLight)
         .font('Helvetica')
         .fontSize(8.5)
         .text("This booking is backed by GoMate's Farmer Protection Guarantee. If the machinery did not arrive within 30 minutes of the ETA, you are eligible for a full refund.", gBoxX + 10, y + 26, { width: W - M - gBoxX - 20 });

      doc.fillColor(BRAND.green)
         .font('Helvetica-Bold')
         .fontSize(8)
         .text('📞 Helpline: +91 98220 12345 (8AM – 8PM)', gBoxX + 10, y + 64);

      y += 96;

      // ─── FOOTER ──────────────────────────────────────────────────────────
      doc.moveTo(M, y).lineTo(W - M, y).strokeColor(BRAND.lineColor).lineWidth(1).stroke();
      y += 10;

      doc.fillColor(BRAND.gray)
         .font('Helvetica')
         .fontSize(8.5)
         .text('Thank you for choosing GoMate! • GoMate वर विश्वास ठेवल्याबद्दल धन्यवाद!', M, y, { align: 'center', width: W - M * 2 });

      doc.fillColor(BRAND.gray)
         .fontSize(7.5)
         .text('This is a computer-generated invoice and does not require a physical signature. | GSTIN: 27AAGCG1234P1Z9', M, y + 14, { align: 'center', width: W - M * 2 });

      // Green bottom accent
      doc.rect(0, 820, W, 21.89).fill(BRAND.green);
      doc.fillColor(BRAND.white)
         .font('Helvetica-Bold')
         .fontSize(8)
         .text('GoMate AgriTech Platform  •  Jath Taluka  •  Powered by Gemini AI', 0, 825, { align: 'center', width: W });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Build a standardised booking object with sensible defaults
 */
function normaliseBooking(raw) {
  return {
    booking_ref: raw.booking_ref || raw.ref || `GM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    status: raw.status || 'confirmed',
    created_at: raw.created_at || new Date().toISOString(),
    work_date: raw.work_date || raw.start_date || raw.created_at || new Date().toISOString(),
    customer_name: raw.customer_name || 'Farmer Customer',
    customer_phone: raw.customer_phone || '+91 XXXXXXXXXX',
    owner_name: raw.owner_name || 'Rajesh Patil',
    owner_phone: raw.owner_phone || '+919822012345',
    equipment_name: raw.equipment_name || raw.equipment_model || 'Mahindra 575 DI (45 HP)',
    attachment: raw.attachment || raw.service_type || 'Rotavator (6-ft)',
    village: raw.village || raw.location || 'Jath',
    hours_booked: Number(raw.hours_booked || raw.duration_hours || raw.duration || 6),
    hourly_rate: Number(raw.hourly_rate || raw.rate || 800),
  };
}

module.exports = { generateInvoicePDF, normaliseBooking };
