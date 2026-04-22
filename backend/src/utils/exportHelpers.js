'use strict';

let ExcelJS;
try { ExcelJS = require('exceljs'); } catch (e) { ExcelJS = null; }

// Escape a value for CSV: wrap in quotes if it contains comma, quote, or newline;
// double any embedded quotes.
function csvCell(val) {
  if (val === null || val === undefined) return '';
  const s = val instanceof Date ? val.toISOString() : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function streamCSV(res, filename, columns, rows) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  const header = columns.map(c => csvCell(c.label || c.key)).join(',');
  res.write(header + '\n');
  for (const r of rows) {
    const line = columns.map(c => csvCell(r[c.key])).join(',');
    res.write(line + '\n');
  }
  res.end();
}

async function streamXLSX(res, filename, sheetName, columns, rows) {
  if (!ExcelJS) {
    // Fallback to CSV if exceljs is unavailable
    return streamCSV(res, filename.replace(/\.xlsx$/i, '.csv'), columns, rows);
  }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName || 'Sheet1');
  ws.columns = columns.map(c => ({ header: c.label || c.key, key: c.key, width: c.width || 18 }));
  ws.addRows(rows);
  ws.getRow(1).font = { bold: true };
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

// Dispatcher: looks at req.query.format (csv|xlsx|json) and streams accordingly
async function exportData(req, res, { baseName, sheetName, columns, rows, jsonOnly = false }) {
  const format = String(req.query.format || 'json').toLowerCase();
  if (jsonOnly || format === 'json') {
    return res.json({ success: true, data: rows });
  }
  if (format === 'csv') {
    return streamCSV(res, `${baseName}.csv`, columns, rows);
  }
  if (format === 'xlsx' || format === 'excel') {
    return streamXLSX(res, `${baseName}.xlsx`, sheetName || baseName, columns, rows);
  }
  return res.status(400).json({ success: false, message: `Unsupported format: ${format}` });
}

module.exports = { csvCell, streamCSV, streamXLSX, exportData };
