import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateBillPDF = (billData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text('HOSPITAL MANAGEMENT SYSTEM', 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('123 Medical Street, City - 123456', 105, 28, { align: 'center' });
  doc.text('Phone: +91-1234567890 | Email: info@hospital.com', 105, 33, { align: 'center' });
  doc.text('GSTIN: 29XXXXX1234X1ZX', 105, 38, { align: 'center' });
  
  // Bill Title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.setFont(undefined, 'bold');
  doc.text('PATIENT BILL', 105, 50, { align: 'center' });
  
  // Bill Details Box
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.rect(15, 58, 180, 25);
  
  // Left side - Bill details
  doc.text(`Bill No: ${billData.bill_no}`, 20, 65);
  doc.text(`Date: ${new Date(billData.date).toLocaleDateString('en-IN')}`, 20, 71);
  doc.text(`Type: ${billData.visit_type}`, 20, 77);
  
  // Right side - Patient details
  doc.text(`Patient: ${billData.patient_name}`, 110, 65);
  doc.text(`UHID: ${billData.uhid}`, 110, 71);
  doc.text(`Mobile: ${billData.mobile || 'N/A'}`, 110, 77);
  
  // Items Table
  const tableData = billData.items.map((item, index) => [
    index + 1,
    item.service_name,
    item.quantity || 1,
    `₹${parseFloat(item.rate || 0).toFixed(2)}`,
    `₹${parseFloat(item.discount || 0).toFixed(2)}`,
    `₹${parseFloat(item.gst_amount || 0).toFixed(2)}`,
    `₹${parseFloat(item.amount || item.net_amount || 0).toFixed(2)}`
  ]);
  
  doc.autoTable({
    startY: 90,
    head: [['#', 'Service Description', 'Qty', 'Rate', 'Discount', 'Tax', 'Amount']],
    body: tableData,
    theme: 'grid',
    headStyles: { 
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 9,
      cellPadding: 3
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 70 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 25 },
      6: { halign: 'right', cellWidth: 25 }
    }
  });
  
  // Summary Box
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setDrawColor(99, 102, 241);
  doc.rect(130, finalY, 65, 35);
  
  doc.setFontSize(10);
  doc.text('Gross Amount:', 135, finalY + 7);
  doc.text(`₹${parseFloat(billData.gross_amount).toFixed(2)}`, 190, finalY + 7, { align: 'right' });
  
  doc.setTextColor(16, 185, 129);
  doc.text('Discount:', 135, finalY + 14);
  doc.text(`- ₹${parseFloat(billData.discount).toFixed(2)}`, 190, finalY + 14, { align: 'right' });
  
  doc.setTextColor(0);
  doc.text('Tax (GST):', 135, finalY + 21);
  doc.text(`₹${parseFloat(billData.tax).toFixed(2)}`, 190, finalY + 21, { align: 'right' });
  
  // Net Amount
  doc.setFontSize(12);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(99, 102, 241);
  doc.text('Net Amount:', 135, finalY + 30);
  doc.text(`₹${parseFloat(billData.net_amount).toFixed(2)}`, 190, finalY + 30, { align: 'right' });
  
  // Amount in words
  doc.setFontSize(9);
  doc.setFont(undefined, 'italic');
  doc.setTextColor(0);
  const amountInWords = numberToWords(parseFloat(billData.net_amount));
  doc.text(`Amount in words: ${amountInWords} Rupees Only`, 20, finalY + 45);
  
  // Payment Status
  doc.setFont(undefined, 'normal');
  doc.text(`Payment Mode: ${billData.payment_mode || 'Pending'}`, 20, finalY + 52);
  doc.text(`Payment Status: ${billData.payment_status}`, 20, finalY + 58);
  if (billData.transaction_ref) {
    doc.text(`Transaction Ref: ${billData.transaction_ref}`, 20, finalY + 64);
  }
  
  // Terms & Conditions
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Terms & Conditions:', 20, finalY + 75);
  doc.text('1. All payments are non-refundable unless approved by management.', 20, finalY + 80);
  doc.text('2. Please retain this bill for future reference and insurance claims.', 20, finalY + 85);
  doc.text('3. In case of any discrepancy, please contact billing department within 24 hours.', 20, finalY + 90);
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241);
  doc.setFont(undefined, 'bold');
  doc.text('Thank you for choosing our hospital!', 105, finalY + 105, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 105, finalY + 111, { align: 'center' });
  doc.text('This is a computer-generated bill and does not require a signature.', 105, finalY + 116, { align: 'center' });
  
  // Save PDF
  const fileName = `Bill_${billData.bill_no}_${billData.patient_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

// Helper function to convert number to words (Indian numbering system)
const numberToWords = (num) => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  if (num === 0) return 'Zero';
  
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = Math.floor(num % 100);
  
  let words = '';
  
  if (crore > 0) {
    words += (crore < 10 ? ones[crore] : tens[Math.floor(crore / 10)] + ' ' + ones[crore % 10]) + ' Crore ';
  }
  if (lakh > 0) {
    words += (lakh < 10 ? ones[lakh] : lakh < 20 ? teens[lakh - 10] : tens[Math.floor(lakh / 10)] + ' ' + ones[lakh % 10]) + ' Lakh ';
  }
  if (thousand > 0) {
    words += (thousand < 10 ? ones[thousand] : thousand < 20 ? teens[thousand - 10] : tens[Math.floor(thousand / 10)] + ' ' + ones[thousand % 10]) + ' Thousand ';
  }
  if (hundred > 0) {
    words += ones[hundred] + ' Hundred ';
  }
  if (remainder > 0) {
    if (remainder < 10) {
      words += ones[remainder];
    } else if (remainder < 20) {
      words += teens[remainder - 10];
    } else {
      words += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10];
    }
  }
  
  return words.trim();
};

export const generateReportPDF = (reportData) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241);
  doc.text('HOSPITAL MANAGEMENT SYSTEM', 105, 20, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text(reportData.title || 'Report', 105, 35, { align: 'center' });
  
  if (reportData.data && Array.isArray(reportData.data)) {
    doc.autoTable({
      startY: 50,
      head: [reportData.headers || []],
      body: reportData.data,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241] }
    });
  }
  
  doc.save(`${reportData.title || 'Report'}.pdf`);
};

export default generateBillPDF;
