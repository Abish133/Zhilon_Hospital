export const generateBillPrintHTML = (billData, charges = []) => {
  const grossAmount = parseFloat(billData.gross_amount || charges.reduce((sum, c) => sum + parseFloat(c.amount || 0), 0));
  const discountAmount = parseFloat(billData.discount_amount || charges.reduce((sum, c) => sum + parseFloat(c.discount_amount || 0), 0));
  const taxAmount = parseFloat(billData.tax_amount || charges.reduce((sum, c) => sum + parseFloat(c.gst_amount || 0), 0));
  const netAmount = parseFloat(billData.net_amount || charges.reduce((sum, c) => sum + parseFloat(c.net_amount || 0), 0));

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Bill - ${billData.patient_name || billData.patient?.first_name + ' ' + billData.patient?.last_name}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            padding: 20px;
            color: #000;
            background: #fff;
          }
          .container { max-width: 900px; margin: 0 auto; }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border: 2px solid #000;
            padding: 20px;
            border-radius: 5px;
          }
          .hospital-name { 
            font-size: 32px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .hospital-details { 
            font-size: 13px; 
            line-height: 1.8;
          }
          .bill-title { 
            background: #000;
            color: #fff;
            font-size: 24px; 
            font-weight: bold; 
            padding: 15px;
            text-align: center;
            margin: 25px 0;
            border-radius: 5px;
          }
          .details-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            gap: 20px;
          }
          .details-box {
            flex: 1;
            border: 1px solid #000;
            padding: 20px;
            border-radius: 5px;
            background: #fff;
          }
          .details-box h3 {
            font-size: 16px;
            color: #000;
            margin-bottom: 15px;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
            font-weight: 600;
          }
          .details-box p {
            font-size: 13px;
            margin: 10px 0;
            line-height: 1.6;
          }
          .details-box strong { 
            color: #000;
            display: inline-block;
            min-width: 120px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 25px 0;
            border: 1px solid #000;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 14px 10px; 
            text-align: left;
            font-size: 13px;
          }
          th { 
            background: #000;
            color: #fff;
            font-weight: 600;
            text-transform: uppercase;
            font-size: 12px;
            letter-spacing: 0.5px;
          }
          tr:nth-child(even) { background-color: #f5f5f5; }
          tr:hover { background-color: #e8e8e8; }
          td:nth-child(3), td:nth-child(4), td:nth-child(5), td:nth-child(6), td:nth-child(7) {
            text-align: right;
            font-family: 'Courier New', monospace;
          }
          th:nth-child(3), th:nth-child(4), th:nth-child(5), th:nth-child(6), th:nth-child(7) {
            text-align: right;
          }
          .summary { 
            margin-top: 35px;
            display: flex;
            justify-content: flex-end;
          }
          .summary-box {
            border: 2px solid #000;
            padding: 25px;
            min-width: 350px;
            border-radius: 5px;
            background: #fff;
          }
          .summary-row { 
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 14px;
            padding: 8px 0;
          }
          .summary-row.total {
            border-top: 2px solid #000;
            padding-top: 15px;
            margin-top: 15px;
            font-size: 18px;
            font-weight: bold;
          }
          .summary-row .amount {
            font-family: 'Courier New', monospace;
            font-weight: 600;
          }
          .amount-words {
            margin: 30px 0;
            padding: 20px;
            background: #f5f5f5;
            border: 1px solid #000;
            font-style: italic;
            font-size: 13px;
            border-radius: 5px;
          }
          .payment-info {
            margin: 25px 0;
            padding: 20px;
            background: #f5f5f5;
            border: 1px solid #000;
            border-radius: 5px;
          }
          .payment-info h4 {
            color: #000;
            margin-bottom: 12px;
            font-size: 15px;
          }
          .payment-info p {
            margin: 8px 0;
            font-size: 13px;
          }
          .terms {
            margin-top: 35px;
            padding: 20px;
            background: #f5f5f5;
            border-radius: 5px;
            font-size: 11px;
            border: 1px solid #000;
          }
          .terms h4 {
            margin-bottom: 12px;
            color: #000;
            font-size: 14px;
          }
          .terms ul {
            margin-left: 20px;
            line-height: 2;
          }
          .footer { 
            text-align: center; 
            margin-top: 45px;
            padding-top: 25px;
            border-top: 2px solid #000;
          }
          .footer p {
            margin: 8px 0;
            font-size: 13px;
          }
          .footer .thank-you {
            color: #000;
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 15px;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border: 1px solid #000;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .container { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${(() => {
            const h = billData.hospital || {};
            const addr = [h.address, h.city, h.pincode].filter(Boolean).join(', ');
            const contact = [h.phone ? `Phone: ${h.phone}` : null, h.email ? `Email: ${h.email}` : null].filter(Boolean).join(' | ');
            const idLine = [h.gst_number ? `GSTIN: ${h.gst_number}` : null, h.registration_number ? `Reg. No: ${h.registration_number}` : null].filter(Boolean).join(' | ');
            return `
          <div class="header">
            <div class="hospital-name">${(h.hospitalName || h.name || 'HOSPITAL').toUpperCase()}</div>
            <div class="hospital-details">
              ${addr ? addr + '<br>' : ''}
              ${contact ? contact + '<br>' : ''}
              ${idLine || ''}
            </div>
          </div>`;
          })()}
          
          <div class="bill-title">PATIENT BILL / INVOICE</div>
          
          <div class="details-section">
            <div class="details-box">
              <h3>📋 Bill Information</h3>
              <p><strong>Bill Number:</strong> ${billData.bill_number || billData.bill_no}</p>
              <p><strong>Bill Date:</strong> ${new Date(billData.bill_date || billData.date).toLocaleString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
              <p><strong>Bill Type:</strong> ${billData.bill_type || billData.visit_type}</p>
              <p><strong>Status:</strong> <span class="status-badge">${billData.payment_status || 'Unpaid'}</span></p>
            </div>
            <div class="details-box">
              <h3>👤 Patient Information</h3>
              <p><strong>Name:</strong> ${billData.patient_name || (billData.patient?.first_name + ' ' + billData.patient?.last_name)}</p>
              <p><strong>UHID:</strong> ${billData.uhid || billData.patient?.uhid}</p>
              <p><strong>Mobile:</strong> ${billData.mobile || billData.patient?.mobile || 'N/A'}</p>
              <p><strong>Email:</strong> ${billData.patient?.email || 'N/A'}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th style="width: 35%">Service Description</th>
                <th style="width: 15%">Category</th>
                <th style="width: 8%">Qty</th>
                <th style="width: 12%">Rate</th>
                <th style="width: 10%">Discount</th>
                <th style="width: 10%">Tax</th>
                <th style="width: 15%">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${charges.length > 0 ? charges.map((charge, idx) => `
                <tr>
                  <td style="text-align: center">${idx + 1}</td>
                  <td>${charge.description || charge.service_name || 'Service'}</td>
                  <td>${charge.service_type || 'General'}</td>
                  <td style="text-align: right">${charge.quantity || 1}</td>
                  <td style="text-align: right">₹${parseFloat(charge.rate || 0).toFixed(2)}</td>
                  <td style="text-align: right">₹${parseFloat(charge.discount_amount || 0).toFixed(2)}</td>
                  <td style="text-align: right">₹${parseFloat(charge.gst_amount || 0).toFixed(2)}</td>
                  <td style="text-align: right; font-weight: bold">₹${parseFloat(charge.net_amount || charge.amount || 0).toFixed(2)}</td>
                </tr>
              `).join('') : `
                <tr>
                  <td style="text-align: center">1</td>
                  <td>${billData.bill_type || 'OPD'} Services</td>
                  <td>Medical</td>
                  <td style="text-align: right">1</td>
                  <td style="text-align: right">₹${grossAmount.toFixed(2)}</td>
                  <td style="text-align: right; color: #10b981">₹${discountAmount.toFixed(2)}</td>
                  <td style="text-align: right">₹${taxAmount.toFixed(2)}</td>
                  <td style="text-align: right; font-weight: bold">₹${netAmount.toFixed(2)}</td>
                </tr>
              `}
            </tbody>
          </table>
          
          <div class="summary">
            <div class="summary-box">
              <div class="summary-row">
                <span>Gross Amount:</span>
                <span class="amount">₹${grossAmount.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Total Discount:</span>
                <span class="amount">- ₹${discountAmount.toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>Taxable Amount:</span>
                <span class="amount">₹${(grossAmount - discountAmount).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>CGST:</span>
                <span class="amount">₹${(taxAmount / 2).toFixed(2)}</span>
              </div>
              <div class="summary-row">
                <span>SGST:</span>
                <span class="amount">₹${(taxAmount / 2).toFixed(2)}</span>
              </div>
              <div class="summary-row total">
                <span>Net Amount:</span>
                <span class="amount">₹${netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="amount-words">
            <strong>Amount in Words:</strong> ${numberToWords(netAmount)} Rupees Only
          </div>
          
          ${billData.paid_amount > 0 || billData.payment_mode ? `
          <div class="payment-info">
            <h4>Payment Information</h4>
            <p><strong>Payment Mode:</strong> ${billData.payment_mode || 'N/A'}</p>
            <p><strong>Paid Amount:</strong> ₹${parseFloat(billData.paid_amount || 0).toFixed(2)}</p>
            <p><strong>Balance Amount:</strong> ₹${parseFloat(billData.balance_amount || 0).toFixed(2)}</p>
            ${billData.transaction_ref ? `<p><strong>Transaction Ref:</strong> ${billData.transaction_ref}</p>` : ''}
          </div>
          ` : ''}
          
          <div class="terms">
            <h4>Terms & Conditions:</h4>
            <ul>
              <li>All payments are non-refundable unless approved by hospital management.</li>
              <li>Please retain this bill for future reference and insurance claims.</li>
              <li>In case of any discrepancy, please contact the billing department within 24 hours.</li>
              <li>This bill is valid for insurance claims as per policy terms.</li>
            </ul>
          </div>
          
          <div class="footer">
            <p class="thank-you">Thank You for Choosing City Hospital!</p>
            <p><strong>For any queries, contact:</strong> billing@cityhospital.com | +91-1234567890</p>
            <p style="margin-top: 15px;">Generated on: ${new Date().toLocaleString('en-IN')}</p>
            <p style="font-size: 10px; color: #666; margin-top: 10px;">This is a computer-generated bill and does not require a physical signature.</p>
          </div>
        </div>
      </body>
    </html>
  `;
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
  
  if (crore > 0) words += (crore < 10 ? ones[crore] : tens[Math.floor(crore / 10)] + ' ' + ones[crore % 10]) + ' Crore ';
  if (lakh > 0) words += (lakh < 10 ? ones[lakh] : lakh < 20 ? teens[lakh - 10] : tens[Math.floor(lakh / 10)] + ' ' + ones[lakh % 10]) + ' Lakh ';
  if (thousand > 0) words += (thousand < 10 ? ones[thousand] : thousand < 20 ? teens[thousand - 10] : tens[Math.floor(thousand / 10)] + ' ' + ones[thousand % 10]) + ' Thousand ';
  if (hundred > 0) words += ones[hundred] + ' Hundred ';
  if (remainder > 0) {
    if (remainder < 10) words += ones[remainder];
    else if (remainder < 20) words += teens[remainder - 10];
    else words += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10];
  }
  
  return words.trim();
};

export const printBill = (billData, charges = []) => {
  const printContent = generateBillPrintHTML(billData, charges);
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
};
