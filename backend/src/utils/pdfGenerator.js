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

const generatePayslipPDF = (res, { payroll, employee, hospital }) => {
  const filename = `payslip_${employee?.emp_code || employee?.employee_id || 'staff'}_${payroll.month}_${payroll.year}.pdf`;
  streamPDFResponse(res, filename, (doc) => {
    renderHospitalHeader(doc, hospital);
    hr(doc);
    doc.fontSize(13).text(`Payslip for ${payroll.month}/${payroll.year}`, { align: 'center' });
    hr(doc);

    doc.fontSize(10);
    twoCol(doc, `Employee: ${employee?.full_name || ''}`, `Emp Code: ${employee?.emp_code || ''}`);
    doc.moveDown();
    twoCol(doc, `Days Worked: ${payroll.days_worked}`, `Days Absent: ${payroll.days_absent}`);
    doc.moveDown();
    twoCol(doc, `Overtime Hours: ${payroll.overtime_hours || 0}`, `Payment Mode: ${payroll.payment_mode || '-'}`);
    hr(doc);

    doc.fontSize(11).text('Earnings', { underline: true });
    doc.fontSize(10);
    twoCol(doc, `Basic Salary (prorated)`, `${Number(payroll.basic_salary).toFixed(2)}`);
    doc.moveDown();
    twoCol(doc, `Total Allowances`, `${Number(payroll.total_allowances).toFixed(2)}`);
    doc.moveDown();
    twoCol(doc, `Gross Salary`, `${Number(payroll.gross_salary).toFixed(2)}`);
    hr(doc);

    doc.fontSize(11).text('Deductions', { underline: true });
    doc.fontSize(10);
    twoCol(doc, `Total Deductions`, `${Number(payroll.total_deductions).toFixed(2)}`);
    hr(doc);

    doc.fontSize(12).text(`Net Salary: ${Number(payroll.net_salary).toFixed(2)}`, { align: 'right' });
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#666').text('This is a system-generated payslip and does not require signature.', { align: 'center' }).fillColor('black');
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
