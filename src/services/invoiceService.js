/**
 * GoMate PDF Invoice & Receipt Generator — v2
 * Bilingual (Marathi + English) professional A4 invoice
 * with itemised breakdown, GoMate guarantee, and UPI payment details.
 */

const PDFDocument = require('pdfkit');

const BRAND = {
  green: '#16A34A',
  darkGreen: '#14532D',
  lightGreen: '#DCFCE7',
  orange: '#D97706',
  slate: '#0F172A',
  slateLight: '#334155',
  gray: '#64748B',
  grayBg: '#F8FAFC',
  lineColor: '#E2E8F0',
  red: '#DC2626',
  white: '#FFFFFF',
  blue: '#1D4ED8',
};

function generateInvoicePDF(booking) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0, info: {
        Title: `GoMate Invoice ${booking.booking_ref}`,
        Author: 'GoMate AgriTech Platform',
        Subject: 'Machinery Rental Invoice'
      }});

      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = 595.28;
      const M = 44;
      const contentW = W - M * 2;

      // ── GREEN HEADER ──────────────────────────────────────────────────────
      doc.rect(0, 0, W, 110).fill(BRAND.green);

      // Brand name
      doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(30)
         .text('GoMate', M, 20);

      // Tagline
      doc.fillColor('#BBF7D0').font('Helvetica').fontSize(11)
         .text('शेतकऱ्यांसाठी मशिनरी भाडे सेवा  •  Machinery Rental for Farmers', M, 56);

      // Contact strip
      doc.fillColor('#D1FAE5').font('Helvetica').fontSize(9)
         .text('gomate.in  |  +91 98220 12345  |  support@gomate.in  |  Jath Taluka, Sangli, MH – 416404', M, 74);

      // "INVOICE" label — top right
      doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(28)
         .text('INVOICE', 0, 22, { align: 'right', width: W - M });
      doc.fillColor('#BBF7D0').font('Helvetica').fontSize(9)
         .text('TAX INVOICE / अधिकृत पावती', 0, 56, { align: 'right', width: W - M });

      // ── BOOKING REF STRIPE ─────────────────────────────────────────────
      doc.rect(0, 110, W, 36).fill(BRAND.slate);

      const refDate = new Date(booking.created_at || Date.now())
        .toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(12)
         .text(`Ref: ${booking.booking_ref}`, M, 122, { continued: true });
      doc.fillColor('#94A3B8').font('Helvetica').fontSize(11)
         .text(`   ·   Invoice Date: ${refDate}`, { continued: true });

      const statusLabel = (booking.status || 'CONFIRMED').toUpperCase();
      const statusCol = booking.status === 'completed' ? '#4ADE80' :
                        booking.status === 'confirmed' ? '#86EFAC' : '#FCD34D';
      doc.fillColor(statusCol).font('Helvetica-Bold').fontSize(11)
         .text(`   ·   ${statusLabel}`);

      let y = 165;

      // ── PARTIES BLOCK ──────────────────────────────────────────────────
      const halfW = contentW / 2 - 10;
      const rightX = M + halfW + 20;

      // Left — Customer
      doc.rect(M, y, halfW, 82).fill(BRAND.grayBg).stroke(BRAND.lineColor);

      doc.fillColor(BRAND.gray).font('Helvetica-Bold').fontSize(8)
         .text('BILLED TO  ·  शेतकरी / Customer', M + 12, y + 10);
      doc.fillColor(BRAND.slate).font('Helvetica-Bold').fontSize(14)
         .text(booking.customer_name || 'Farmer Customer', M + 12, y + 24, { width: halfW - 20 });
      doc.fillColor(BRAND.gray).font('Helvetica').fontSize(10)
         .text(`📱 ${booking.customer_phone || '+91 XXXXXXXXXX'}`, M + 12, y + 44)
         .text(`📍 ${booking.village || 'Jath Taluka'}, Sangli District`, M + 12, y + 58);

      // Right — Owner
      doc.rect(rightX, y, halfW, 82).fill(BRAND.grayBg).stroke(BRAND.lineColor);

      doc.fillColor(BRAND.gray).font('Helvetica-Bold').fontSize(8)
         .text('SERVICE BY  ·  मशिनरी मालक', rightX + 12, y + 10);
      doc.fillColor(BRAND.slate).font('Helvetica-Bold').fontSize(14)
         .text(booking.owner_name || 'Rajesh Patil', rightX + 12, y + 24, { width: halfW - 20 });
      doc.fillColor(BRAND.gray).font('Helvetica').fontSize(10)
         .text(`📱 ${booking.owner_phone || '+919822012345'}`, rightX + 12, y + 44);
      doc.fillColor(BRAND.green).font('Helvetica-Bold').fontSize(9)
         .text('✅ GoMate Verified Owner Pro', rightX + 12, y + 60);

      y += 98;

      // ── WORK SUMMARY BOX ───────────────────────────────────────────────
      doc.rect(M, y, contentW, 66).fill(BRAND.lightGreen).stroke(BRAND.green);

      doc.fillColor(BRAND.darkGreen).font('Helvetica-Bold').fontSize(9)
         .text('WORK / SERVICE DETAILS  ·  काम व सेवा तपशील', M + 14, y + 10);

      const workDate = new Date(booking.work_date || booking.created_at || Date.now())
        .toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

      doc.fillColor(BRAND.slate).font('Helvetica-Bold').fontSize(13)
         .text(booking.equipment_name || 'Mahindra 575 DI (45 HP) Tractor', M + 14, y + 24, { width: contentW * 0.6 });

      // Right side work info
      doc.fillColor(BRAND.slateLight).font('Helvetica').fontSize(10)
         .text(`Attachment:  ${booking.attachment || 'Rotavator (6-ft)'}`, M + 14, y + 42)
         .text(`Work Date:  ${workDate}   ·   Duration:  ${booking.hours_booked || 6} Hours   ·   Location:  ${booking.village || 'Shegaon'}, Jath`, M + 14, y + 55);

      y += 82;

      // ── ITEMISED TABLE ─────────────────────────────────────────────────
      doc.fillColor(BRAND.slateLight).font('Helvetica-Bold').fontSize(9)
         .text('ITEMISED COST BREAKDOWN  ·  खर्चाचा तपशील', M, y + 2);
      y += 16;

      // Table Header
      doc.rect(M, y, contentW, 26).fill(BRAND.slate);
      doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(9);
      doc.text('Description  (सेवेचे नाव)', M + 12, y + 9, { width: contentW * 0.46 });
      doc.text('Qty / Hrs', M + contentW * 0.48, y + 9, { width: 60, align: 'center' });
      doc.text('Rate (₹)', M + contentW * 0.63, y + 9, { width: 70, align: 'right' });
      doc.text('Amount (₹)', M + contentW * 0.79, y + 9, { width: contentW * 0.21, align: 'right' });

      y += 26;

      const hours = booking.hours_booked || 6;
      const rate = booking.hourly_rate || 800;
      const gross = rate * hours;
      const platformFee = Math.round(gross * 0.08);
      const gst = Math.round(platformFee * 0.18);
      const total = gross + platformFee + gst;

      const items = [
        {
          desc: `${booking.equipment_name || 'Tractor'} — Machinery Rental`,
          descMr: 'यंत्र भाडे (Hourly Rate × Hours Worked)',
          qty: `${hours} hrs`,
          rate: `₹${rate.toLocaleString('en-IN')}/hr`,
          amount: `₹${gross.toLocaleString('en-IN')}`,
          amtColor: BRAND.slate,
          bg: BRAND.white
        },
        {
          desc: `${booking.attachment || 'Attachment & Operator'}`,
          descMr: 'अवजार व ड्रायव्हर शुल्क — भाड्यात समाविष्ट',
          qty: `${hours} hrs`,
          rate: '—',
          amount: 'INCLUDED',
          amtColor: BRAND.green,
          bg: BRAND.grayBg
        },
        {
          desc: 'GoMate Platform Service Fee  (8%)',
          descMr: 'गोमेट सेवा शुल्क — बुकिंग व गॅरंटी',
          qty: '—',
          rate: '8% of rental',
          amount: `₹${platformFee.toLocaleString('en-IN')}`,
          amtColor: BRAND.slate,
          bg: BRAND.white
        },
        {
          desc: 'GST on Service Fee  (18%)',
          descMr: 'जीएसटी — GSTIN: 27AAGCG1234P1Z9',
          qty: '—',
          rate: '18% of fee',
          amount: `₹${gst.toLocaleString('en-IN')}`,
          amtColor: BRAND.slate,
          bg: BRAND.grayBg
        },
      ];

      items.forEach((item, i) => {
        const rowH = 32;
        doc.rect(M, y, contentW, rowH).fill(item.bg).stroke(BRAND.lineColor);

        doc.fillColor(BRAND.slate).font('Helvetica-Bold').fontSize(10)
           .text(item.desc, M + 12, y + 5, { width: contentW * 0.44 });
        doc.fillColor(BRAND.gray).font('Helvetica').fontSize(8)
           .text(item.descMr, M + 12, y + 18, { width: contentW * 0.44 });

        doc.fillColor(BRAND.slateLight).font('Helvetica').fontSize(10)
           .text(item.qty, M + contentW * 0.48, y + 11, { width: 60, align: 'center' });
        doc.fillColor(BRAND.gray).font('Helvetica').fontSize(9)
           .text(item.rate, M + contentW * 0.63, y + 11, { width: 70, align: 'right' });
        doc.fillColor(item.amtColor).font('Helvetica-Bold').fontSize(10)
           .text(item.amount, M + contentW * 0.79, y + 11, { width: contentW * 0.21, align: 'right' });

        y += rowH;
      });

      // Sub-divider
      doc.moveTo(M, y).lineTo(M + contentW, y).strokeColor(BRAND.lineColor).lineWidth(1).stroke();
      y += 2;

      // Subtotal row
      doc.rect(M, y, contentW, 24).fill('#EFF6FF');
      doc.fillColor(BRAND.blue).font('Helvetica-Bold').fontSize(10)
         .text('Sub-total (Rental + Fees):', M + 12, y + 7, { width: contentW * 0.7 });
      doc.fillColor(BRAND.slate).font('Helvetica-Bold').fontSize(11)
         .text(`₹${total.toLocaleString('en-IN')}`, M, y + 7, { width: contentW + M - 12, align: 'right' });
      y += 24;

      // Total row
      doc.rect(M, y, contentW, 40).fill(BRAND.slate);
      doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(14)
         .text('TOTAL AMOUNT DUE  ·  एकूण देय रक्कम', M + 12, y + 12, { width: contentW * 0.6 });
      doc.fillColor('#4ADE80').font('Helvetica-Bold').fontSize(18)
         .text(`₹${total.toLocaleString('en-IN')}`, M, y + 10, { width: contentW + M - 12, align: 'right' });
      y += 55;

      // ── PAYMENT + GUARANTEE ─────────────────────────────────────────────
      const colW = (contentW - 16) / 2;

      // Payment box (left)
      doc.rect(M, y, colW, 90).fill(BRAND.grayBg).stroke(BRAND.lineColor);
      doc.fillColor(BRAND.slateLight).font('Helvetica-Bold').fontSize(9)
         .text('PAYMENT METHODS  ·  पेमेंट पर्याय', M + 12, y + 12);
      doc.fillColor(BRAND.slate).font('Helvetica').fontSize(10)
         .text('UPI ID:  gomate@upi', M + 12, y + 28)
         .text('GPay / PhonePe / Paytm accepted', M + 12, y + 42)
         .text('Bank: HDFC Bank', M + 12, y + 56)
         .text('A/C: 1234567890  ·  IFSC: HDFC0001234', M + 12, y + 70);

      // Guarantee box (right)
      const gX = M + colW + 16;
      doc.rect(gX, y, colW, 90).fill('#F0FDF4').stroke(BRAND.green);
      doc.fillColor(BRAND.darkGreen).font('Helvetica-Bold').fontSize(9)
         .text('GOMATE QUALITY GUARANTEE  ·  गुणवत्ता हमी', gX + 12, y + 12);
      doc.fillColor(BRAND.slateLight).font('Helvetica').fontSize(9)
         .text("Backed by GoMate's Farmer Protection Policy. If the machinery did not arrive within 30 minutes of the scheduled ETA, you qualify for a full refund.", gX + 12, y + 28, { width: colW - 24 });
      doc.fillColor(BRAND.green).font('Helvetica-Bold').fontSize(9)
         .text('Helpline: +91 98220 12345  (8AM – 8PM)', gX + 12, y + 72);

      y += 106;

      // ── FOOTER ──────────────────────────────────────────────────────────
      doc.moveTo(M, y).lineTo(M + contentW, y).strokeColor(BRAND.lineColor).lineWidth(1).stroke();
      y += 10;
      doc.fillColor(BRAND.gray).font('Helvetica').fontSize(8.5)
         .text('Thank you for choosing GoMate!  •  GoMate वर विश्वास ठेवल्याबद्दल धन्यवाद!', 0, y, { align: 'center', width: W });
      doc.fillColor(BRAND.gray).font('Helvetica').fontSize(7.5)
         .text('This is a computer-generated invoice. No physical signature required.  |  GSTIN: 27AAGCG1234P1Z9  |  CIN: U01400MH2026PTC12345', 0, y + 13, { align: 'center', width: W });

      doc.rect(0, 820, W, 22).fill(BRAND.green);
      doc.fillColor(BRAND.white).font('Helvetica-Bold').fontSize(8.5)
         .text('GoMate AgriTech Platform  ·  Jath Taluka, Sangli  ·  Powered by Gemini AI  ·  gomate.in', 0, 826, { align: 'center', width: W });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

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
