'use strict';

let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (e) {
  PDFDocument = null;
}

const ensureAvailable = () => {
  if (!PDFDocument) {
    throw new Error('pdfkit is not installed. Run: npm install pdfkit');
  }
};

const streamPDFResponse = (res, filename, build) => {
  ensureAvailable();
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  doc.pipe(res);
  try {
    build(doc);
    doc.end();
  } catch (err) {
    doc.end();
    throw err;
  }
};

const hr = (doc) => {
  doc.moveDown(0.4);
  doc.strokeColor('#888').lineWidth(0.5)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .stroke();
  doc.moveDown(0.6);
};

const twoCol = (doc, left, right) => {
  const leftX = doc.page.margins.left;
  const rightX = doc.page.width / 2;
  const y = doc.y;
  doc.fontSize(10).text(left, leftX, y, { width: rightX - leftX - 10 });
  doc.text(right, rightX, y, { width: doc.page.width - doc.page.margins.right - rightX });
};

// Hospital letterhead: logo (if URL/path resolves), name, address, GST/reg, phone, email.
const renderHospitalHeader = (doc, hospital) => {
  if (!hospital) return;
  const startY = doc.y;
  let textX = doc.page.margins.left;

  if (hospital.logo_url) {
    try {
      const fs = require('fs');
      const path = require('path');
      const candidate = /^https?:/i.test(hospital.logo_url)
        ? null
        : path.join(process.cwd(), hospital.logo_url.replace(/^\//, ''));
      if (candidate && fs.existsSync(candidate)) {
        doc.image(candidate, doc.page.margins.left, startY, { fit: [60, 60] });
        textX += 70;
      }
    } catch (e) { /* ignore */ }
  }

  doc.fontSize(16).text(hospital.hospitalName || 'Hospital', textX, startY, { align: 'left' });
  doc.fontSize(9);
  if (hospital.address) doc.text(hospital.address, textX);
  const metaBits = [];
  if (hospital.phone) metaBits.push(`Ph: ${hospital.phone}`);
  if (hospital.hospitalEmail) metaBits.push(hospital.hospitalEmail);
  if (hospital.website) metaBits.push(hospital.website);
  if (metaBits.length) doc.text(metaBits.join('  |  '), textX);
  const idBits = [];
  if (hospital.registration_number) idBits.push(`Reg: ${hospital.registration_number}`);
  if (hospital.gst_number) idBits.push(`GSTIN: ${hospital.gst_number}`);
  if (idBits.length) doc.text(idBits.join('  |  '), textX);
  doc.moveDown(0.5);
};

const renderHospitalFooter = (doc, hospital) => {
  if (!hospital || !hospital.footer_html) return;
  const y = doc.page.height - doc.page.margins.bottom - 20;
  doc.fontSize(8).fillColor('#666').text(
    String(hospital.footer_html).replace(/<[^>]+>/g, ''),
    doc.page.margins.left,
    y,
    { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
  ).fillColor('black');
};

// ── Payslip helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const fmtINR = (n) => {
  const num = Number(n || 0);
  // Indian grouping: 12,34,567.89 — Intl handles this with the en-IN locale.
  return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Convert a number to Indian-style words ("Rupees Twelve Thousand Three Hundred Forty Five Only").
// Handles up to 99,99,99,999 (99 crore) which is more than enough for any payroll.
const numberToWordsIndian = (num) => {
  num = Math.round(Number(num || 0));
  if (num === 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const twoDigit = (n) => {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  };
  const threeDigit = (n) => {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return (h ? ones[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? twoDigit(r) : '');
  };

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  let parts = [];
  if (crore) parts.push(twoDigit(crore) + ' Crore');
  if (lakh) parts.push(twoDigit(lakh) + ' Lakh');
  if (thousand) parts.push(twoDigit(thousand) + ' Thousand');
  if (rest) parts.push(threeDigit(rest));
  return 'Rupees ' + parts.join(' ').replace(/\s+/g, ' ').trim() + ' Only';
};

// Draw a labelled cell — used to build the employee-info grid.
// Monochrome: white background, thin black border, gray label, black value.
const drawCell = (doc, x, y, w, h, label, value, opts = {}) => {
  const { fillBg = false } = opts;
  if (fillBg) doc.rect(x, y, w, h).fill('#f2f2f2').fillColor('black');
  doc.lineWidth(0.6).strokeColor('#000').rect(x, y, w, h).stroke();
  doc.fontSize(7.5).fillColor('#555').font('Helvetica').text(label, x + 6, y + 4, { width: w - 12 });
  doc.fontSize(10).fillColor('#000').font('Helvetica-Bold')
    .text(String(value || '—'), x + 6, y + 14, { width: w - 12, height: h - 17, ellipsis: true });
  doc.font('Helvetica').fillColor('black');
};

// Draw a row inside an earnings/deductions table at vertical position `y`.
// Monochrome: white rows, light-gray for header/total bands.
const drawTableRow = (doc, x, y, colWidths, label, amount, opts = {}) => {
  const { bold = false, bg = null, height = 18 } = opts;
  const totalW = colWidths[0] + colWidths[1];
  if (bg) doc.rect(x, y, totalW, height).fill(bg).fillColor('black');
  doc.lineWidth(0.5).strokeColor('#000');
  doc.rect(x, y, colWidths[0], height).stroke();
  doc.rect(x + colWidths[0], y, colWidths[1], height).stroke();
  doc.fontSize(9.5)
    .font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .fillColor('#000');
  doc.text(label, x + 6, y + 5, { width: colWidths[0] - 12 });
  doc.text(amount, x + colWidths[0] + 6, y + 5, { width: colWidths[1] - 12, align: 'right' });
  doc.font('Helvetica').fillColor('black');
};

const generatePayslipPDF = (res, { payroll, employee, hospital, structure }) => {
  const filename = `payslip_${employee?.emp_code || employee?.employee_id || 'staff'}_${payroll.month}_${payroll.year}.pdf`;

  streamPDFResponse(res, filename, (doc) => {
    const pageW = doc.page.width;
    const margin = doc.page.margins.left;
    const contentW = pageW - margin * 2;

    // ── Hospital letterhead ─────────────────────────────────────────────────
    renderHospitalHeader(doc, hospital);

    // ── Title bar ──────────────────────────────────────────────────────────
    // Solid black bar with white text — strong, professional, monochrome.
    doc.moveDown(0.4);
    let y = doc.y;
    doc.rect(margin, y, contentW, 26).fill('#000').fillColor('white');
    doc.fontSize(12).font('Helvetica-Bold')
      .text(`PAYSLIP FOR ${MONTH_NAMES[payroll.month - 1] || payroll.month} ${payroll.year}`,
        margin, y + 7, { width: contentW, align: 'center', characterSpacing: 1.5 });
    doc.fillColor('black').font('Helvetica');
    y += 26 + 10;

    // ── Employee details grid (2 cols × 5 rows) ────────────────────────────
    const cellH = 30;
    const cellW = contentW / 2;
    const fields = [
      ['Employee Name', employee?.full_name || '—'],
      ['Employee Code', employee?.emp_code || '—'],
      ['Designation', employee?.designation || employee?.role || '—'],
      ['Department', employee?.department?.department_name || '—'],
      ['Date of Joining', employee?.joining_date ? new Date(employee.joining_date).toLocaleDateString('en-IN') : '—'],
      ['PAN Number', employee?.pan_number || '—'],
      ['UAN Number', employee?.uan_number || '—'],
      ['Bank Account', employee?.bank_account_number || '—'],
      ['IFSC Code', employee?.ifsc_code || '—'],
      ['Payment Date', payroll.payment_date ? new Date(payroll.payment_date).toLocaleDateString('en-IN') : '—']
    ];
    for (let i = 0; i < fields.length; i += 2) {
      const rowY = y + Math.floor(i / 2) * cellH;
      drawCell(doc, margin, rowY, cellW, cellH, fields[i][0], fields[i][1]);
      if (fields[i + 1]) drawCell(doc, margin + cellW, rowY, cellW, cellH, fields[i + 1][0], fields[i + 1][1]);
    }
    y += Math.ceil(fields.length / 2) * cellH + 8;

    // ── Attendance summary ─────────────────────────────────────────────────
    const attH = 28;
    const attCol = contentW / 4;
    const attFields = [
      ['Days Worked', String(payroll.days_worked ?? '—')],
      ['Days Absent', String(payroll.days_absent ?? '—')],
      ['Overtime (hrs)', String(payroll.overtime_hours ?? 0)],
      ['Payment Mode', payroll.payment_mode || '—']
    ];
    attFields.forEach(([label, value], idx) => {
      drawCell(doc, margin + idx * attCol, y, attCol, attH, label, value, { fillBg: true });
    });
    y += attH + 14;

    // ── Earnings & Deductions tables (side-by-side) ────────────────────────
    const tableW = contentW / 2 - 6;
    const labelW = tableW * 0.62;
    const amtW = tableW - labelW;
    const colWidths = [labelW, amtW];
    const earnX = margin;
    const dedX = margin + tableW + 12;

    // Try to itemize from SalaryStructure. If component sum disagrees with
    // payroll totals (e.g. due to proration/leave deductions), we surface the
    // delta as an "Adjustment" row so debit and credit sides always reconcile.
    const struct = structure || {};
    const basicStruct = Number(struct.basic_salary || 0);
    const basicActual = Number(payroll.basic_salary || 0);
    const ratio = basicStruct > 0 ? basicActual / basicStruct : 1;

    const proRated = (v) => Number(v || 0) * (ratio || 1);

    const earningRows = [
      ['Basic Salary', basicActual],
      ['House Rent Allowance (HRA)', proRated(struct.hra)],
      ['Medical Allowance', proRated(struct.medical_allowance)],
      ['Transport Allowance', proRated(struct.transport_allowance)],
      ['Other Allowances', proRated(struct.other_allowances)]
    ];
    // Bonus is a flat earning (not prorated).
    if (Number(struct.bonus || 0) > 0) earningRows.push(['Bonus', Number(struct.bonus)]);
    if (Number(payroll.overtime_hours || 0) > 0) {
      // Overtime amount isn't stored separately — surface only the hours; pay
      // is rolled into total_allowances. Caller can read it in the table.
      earningRows.push(['Overtime', 0]);
    }
    const itemizedEarn = earningRows.reduce((s, [, v]) => s + Number(v || 0), 0);
    const grossActual = Number(payroll.gross_salary || 0);
    const earnAdj = grossActual - itemizedEarn;
    if (Math.abs(earnAdj) > 0.5) earningRows.push(['Adjustment / Other', earnAdj]);

    // Deductions: PF/TDS are percentages of basic; PT/other are flat amounts.
    const pfAmt = (Number(struct.pf_percentage || 0) / 100) * basicActual;
    const tdsAmt = (Number(struct.tds_percentage || 0) / 100) * basicActual;
    const ptAmt = Number(struct.pt_amount || 0);
    const esiAmt = (Number(struct.esi_percentage || 0) / 100) * grossActual;
    const lwfAmt = Number(struct.lwf_amount || 0);
    const otherDed = Number(struct.other_deductions || 0);
    const dedRows = [
      ['Provident Fund (PF)', pfAmt],
      ['Professional Tax (PT)', ptAmt],
      ['ESI', esiAmt],
      ['Labour Welfare Fund (LWF)', lwfAmt],
      ['TDS / Income Tax', tdsAmt],
      ['Other Deductions', otherDed]
    ];
    const itemizedDed = dedRows.reduce((s, [, v]) => s + Number(v || 0), 0);
    const totalDedActual = Number(payroll.total_deductions || 0);
    const dedAdj = totalDedActual - itemizedDed;
    if (Math.abs(dedAdj) > 0.5) dedRows.push(['Adjustment / Other', dedAdj]);

    // Pad shorter side so both tables end at the same y — looks balanced.
    while (earningRows.length < dedRows.length) earningRows.push(['', 0]);
    while (dedRows.length < earningRows.length) dedRows.push(['', 0]);

    // Headers — same gray for both sides, distinguished only by typography.
    drawTableRow(doc, earnX, y, colWidths, 'EARNINGS', 'Amount (INR)', { bold: true, bg: '#e8e8e8', height: 22 });
    drawTableRow(doc, dedX, y, colWidths, 'DEDUCTIONS', 'Amount (INR)', { bold: true, bg: '#e8e8e8', height: 22 });
    let rowY = y + 22;
    const rowH = 18;

    earningRows.forEach((r, i) => {
      const value = r[0] === '' ? '' : fmtINR(r[1]);
      drawTableRow(doc, earnX, rowY + i * rowH, colWidths, r[0] || ' ', value);
    });
    dedRows.forEach((r, i) => {
      const value = r[0] === '' ? '' : fmtINR(r[1]);
      drawTableRow(doc, dedX, rowY + i * rowH, colWidths, r[0] || ' ', value);
    });
    rowY += earningRows.length * rowH;

    // Totals — same gray as headers; bold typography carries the emphasis.
    drawTableRow(doc, earnX, rowY, colWidths, 'Gross Earnings', fmtINR(grossActual), { bold: true, bg: '#e8e8e8', height: 22 });
    drawTableRow(doc, dedX, rowY, colWidths, 'Total Deductions', fmtINR(totalDedActual), { bold: true, bg: '#e8e8e8', height: 22 });
    rowY += 22 + 16;

    // ── Net Pay block ──────────────────────────────────────────────────────
    // Black banner, white amount — the single highest-contrast element on the
    // page. Drives the eye exactly where it should land.
    const netPay = Number(payroll.net_salary || 0);
    const netH = 44;
    doc.rect(margin, rowY, contentW, netH).fill('#000').fillColor('white');
    doc.fontSize(10).font('Helvetica-Bold').text('NET PAY', margin + 14, rowY + 9, { characterSpacing: 1.2 });
    doc.fontSize(8).font('Helvetica')
      .text('(Gross Earnings − Total Deductions)', margin + 14, rowY + 25);
    doc.fontSize(22).font('Helvetica-Bold')
      .text(`Rs. ${fmtINR(netPay)}`, margin, rowY + 11, { width: contentW - 16, align: 'right' });
    doc.fillColor('black').font('Helvetica');
    rowY += netH + 8;

    // ── Amount in words ────────────────────────────────────────────────────
    const wordsH = 26;
    doc.rect(margin, rowY, contentW, wordsH).strokeColor('#000').lineWidth(0.6).stroke();
    doc.fontSize(8.5).fillColor('#555').font('Helvetica')
      .text('AMOUNT IN WORDS', margin + 8, rowY + 5, { characterSpacing: 0.6 });
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#000')
      .text(numberToWordsIndian(netPay), margin + 8, rowY + 14, { width: contentW - 16 });
    doc.font('Helvetica').fillColor('black');
    rowY += wordsH + 36;

    // ── Signature blocks ───────────────────────────────────────────────────
    const sigW = (contentW - 30) / 3;
    const sigY = rowY;
    const sigs = ['Employee Signature', 'Prepared By', 'Authorized Signatory'];
    sigs.forEach((label, idx) => {
      const sx = margin + idx * (sigW + 15);
      doc.strokeColor('#000').lineWidth(0.6)
        .moveTo(sx, sigY).lineTo(sx + sigW, sigY).stroke();
      doc.fontSize(8.5).fillColor('#000').font('Helvetica')
        .text(label, sx, sigY + 5, { width: sigW, align: 'center', characterSpacing: 0.4 });
    });
    rowY += 32;

    // ── Footer disclaimer — thin top border + small uppercase caption ──────
    doc.strokeColor('#000').lineWidth(0.4)
      .moveTo(margin, rowY).lineTo(margin + contentW, rowY).stroke();
    doc.fontSize(7.5).fillColor('#555').font('Helvetica')
      .text(
        'This is a system-generated payslip. No signature is required if digitally verified. ' +
        'For any payroll queries, please contact the HR department.',
        margin, rowY + 6, { width: contentW, align: 'center' }
      ).fillColor('black');

    renderHospitalFooter(doc, hospital);
  });
};

const generatePrescriptionPDF = (res, { prescription, patient, doctor, hospital, items = [] }) => {
  const filename = `prescription_${prescription.prescription_id || 'rx'}.pdf`;
  streamPDFResponse(res, filename, (doc) => {
    renderHospitalHeader(doc, hospital);
    hr(doc);
    doc.fontSize(13).text('Prescription', { align: 'center' });
    hr(doc);

    doc.fontSize(10);
    twoCol(doc, `Patient: ${patient ? `${patient.first_name || ''} ${patient.last_name || ''}` : ''}`, `UHID: ${patient?.uhid || ''}`);
    doc.moveDown();
    twoCol(doc, `Age/Sex: ${patient?.age || ''}/${patient?.gender || ''}`, `Date: ${new Date(prescription.prescription_date || Date.now()).toLocaleDateString('en-IN')}`);
    doc.moveDown();
    twoCol(doc, `Doctor: ${doctor?.name || ''}`, `Reg: ${doctor?.registration_number || doctor?.license_number || ''}`);
    hr(doc);

    doc.fontSize(11).text('Rx', { underline: true });
    doc.moveDown(0.2);
    doc.fontSize(10);
    items.forEach((it, idx) => {
      doc.text(`${idx + 1}. ${it.medicine_name || ''}  -  ${it.dosage || ''}  ${it.frequency || ''}  x  ${it.duration || ''}`);
      if (it.instructions) doc.fontSize(9).fillColor('#555').text(`   ${it.instructions}`).fillColor('black').fontSize(10);
    });

    if (prescription.advice) {
      doc.moveDown();
      doc.fontSize(11).text('Advice', { underline: true });
      doc.fontSize(10).text(prescription.advice);
    }

    doc.moveDown(2);
    doc.fontSize(10).text(`Signature: ${doctor?.name || ''}`, { align: 'right' });
    renderHospitalFooter(doc, hospital);
  });
};

module.exports = {
  streamPDFResponse,
  generatePayslipPDF,
  generatePrescriptionPDF
};
