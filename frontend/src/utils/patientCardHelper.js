import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import apiClient from '@config/api';

// Logos are stored as relative paths ("/uploads/logos/..") served from the
// backend origin (not under /api). Build an absolute URL for previewing/printing.
const ASSET_BASE = (apiClient.defaults.baseURL || '').replace(/\/api\/?$/, '');
const toLogoUrl = (u) => !u ? null : (/^https?:/i.test(u) ? u : `${ASSET_BASE}${u.startsWith('/') ? '' : '/'}${u}`);

// Escape user-provided text before it goes into the print/preview HTML string.
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const ageOf = (dob) => (dob ? dayjs().diff(dayjs(dob), 'year') : null);
const fmt = (d) => (d ? dayjs(d).format('DD MMM YYYY') : '—');

// Normalise the loosely-shaped patient object the various callers pass in
// (list row, register response, timeline patient) into the fields the card needs.
const readPatient = (p = {}) => {
  const first = p.first_name || '';
  const last = p.last_name || '';
  const fullName = `${first} ${last}`.trim() || 'Patient';
  const initials = ((first[0] || '') + (last[0] || '')).toUpperCase() || 'P';
  const age = ageOf(p.date_of_birth);
  return {
    fullName,
    initials,
    uhid: p.uhid || '—',
    age: age != null ? `${age} Yrs` : '—',
    gender: p.gender || '—',
    blood: p.blood_group || '—',
    dob: fmt(p.date_of_birth),
    mobile: p.mobile_number || p.mobile || '—',
    marital: p.marital_status || '—',
    city: [p.city, p.state].filter(Boolean).join(', ') || '—',
    emergency: [p.emergency_contact_name, p.emergency_contact_number].filter(Boolean).join(' · '),
    registered: fmt(p.createdAt || p.created_at || new Date())
  };
};

const readHospital = (h = {}) => ({
  name: h.hospitalName || h.name || 'Hospital',
  contact: [h.phone, h.hospitalEmail || h.email].filter(Boolean).join('  •  '),
  logo: toLogoUrl(h.logo_url)
});

// Decorative barcode-style bars derived from the UHID so every card looks unique.
const barSpans = (seedRaw) => {
  const seed = (String(seedRaw).replace(/[^A-Za-z0-9]/g, '') || 'UHID');
  let bars = '';
  for (let i = 0; i < 46; i++) {
    const c = seed.charCodeAt(i % seed.length) + i * 7;
    const h = 14 + (c % 20);
    const w = (c % 3) + 1;
    bars += `<i style="height:${h}px;width:${w}px"></i>`;
  }
  return bars;
};

const CARD_STYLES = `
.bhpc-card{width:540px;border-radius:18px;overflow:hidden;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#fff;box-shadow:0 14px 44px rgba(15,23,42,.20);border:1px solid #e2e8f0;}
.bhpc-head{background:linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#4c1d95 100%);padding:18px 22px 20px;display:flex;align-items:center;gap:14px;position:relative;}
.bhpc-head::after{content:'';position:absolute;left:0;right:0;bottom:0;height:4px;background:linear-gradient(90deg,#8b5cf6,#6366f1,#22d3ee);}
.bhpc-logo{width:48px;height:48px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;color:#4c1d95;font-size:18px;overflow:hidden;flex:none;}
.bhpc-logo img{width:100%;height:100%;object-fit:contain;}
.bhpc-hname{color:#fff;font-size:19px;font-weight:800;letter-spacing:.4px;line-height:1.15;}
.bhpc-hsub{color:#c7d2fe;font-size:10px;letter-spacing:3px;font-weight:700;margin-top:4px;text-transform:uppercase;}
.bhpc-body{display:flex;gap:18px;padding:20px 22px 16px;}
.bhpc-avatar{width:86px;height:86px;border-radius:16px;background:linear-gradient(135deg,#ede9fe,#e0e7ff);color:#4c1d95;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;flex:none;border:2px solid #ddd6fe;}
.bhpc-info{flex:1;min-width:0;}
.bhpc-name{font-size:22px;font-weight:800;color:#0f172a;line-height:1.1;}
.bhpc-uhid{display:inline-flex;align-items:center;gap:10px;margin-top:9px;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:6px 12px;}
.bhpc-uhid b{font-size:9px;color:#7c3aed;letter-spacing:1.5px;text-transform:uppercase;}
.bhpc-uhid span{font-family:'Courier New',monospace;font-size:15px;font-weight:700;color:#1e1b4b;letter-spacing:1px;}
.bhpc-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:11px 14px;margin-top:15px;}
.bhpc-f label{display:block;font-size:9px;color:#94a3b8;letter-spacing:1px;text-transform:uppercase;font-weight:700;}
.bhpc-f div{font-size:13px;color:#0f172a;font-weight:600;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.bhpc-blood{color:#dc2626 !important;}
.bhpc-foot{display:flex;justify-content:space-between;align-items:flex-end;background:#f8fafc;border-top:1px solid #e2e8f0;padding:12px 22px;}
.bhpc-foot .l{font-size:10px;color:#64748b;line-height:1.7;}
.bhpc-foot .l b{color:#334155;font-weight:700;}
.bhpc-barcode{display:flex;align-items:flex-end;gap:1.5px;height:36px;justify-content:flex-end;}
.bhpc-barcode i{display:block;background:#0f172a;}
.bhpc-bccode{text-align:right;font-family:'Courier New',monospace;font-size:9px;letter-spacing:2px;color:#475569;margin-top:5px;}
`;

// Returns "<style>… </style><div class='bhpc-card'>…</div>" so the same markup
// drives both the in-app modal preview and the print window.
export const getPatientCardInnerHTML = (patient, hospital) => {
  const p = readPatient(patient);
  const h = readHospital(hospital);
  return `<style>${CARD_STYLES}</style>
  <div class="bhpc-card">
    <div class="bhpc-head">
      <div class="bhpc-logo">${h.logo ? `<img src="${esc(h.logo)}" alt="logo"/>` : esc(p.initials)}</div>
      <div>
        <div class="bhpc-hname">${esc(h.name)}</div>
        <div class="bhpc-hsub">Patient Identification Card</div>
      </div>
    </div>
    <div class="bhpc-body">
      <div class="bhpc-avatar">${esc(p.initials)}</div>
      <div class="bhpc-info">
        <div class="bhpc-name">${esc(p.fullName)}</div>
        <div class="bhpc-uhid"><b>UHID</b><span>${esc(p.uhid)}</span></div>
        <div class="bhpc-grid">
          <div class="bhpc-f"><label>Age</label><div>${esc(p.age)}</div></div>
          <div class="bhpc-f"><label>Gender</label><div>${esc(p.gender)}</div></div>
          <div class="bhpc-f"><label>Blood Group</label><div class="bhpc-blood">${esc(p.blood)}</div></div>
          <div class="bhpc-f"><label>Date of Birth</label><div>${esc(p.dob)}</div></div>
          <div class="bhpc-f"><label>Mobile</label><div>${esc(p.mobile)}</div></div>
          <div class="bhpc-f"><label>Marital Status</label><div>${esc(p.marital)}</div></div>
        </div>
      </div>
    </div>
    <div class="bhpc-foot">
      <div class="l">
        <div><b>City:</b> ${esc(p.city)}</div>
        ${p.emergency ? `<div><b>Emergency:</b> ${esc(p.emergency)}</div>` : ''}
        <div><b>Registered:</b> ${esc(p.registered)}</div>
      </div>
      <div>
        <div class="bhpc-barcode">${barSpans(p.uhid)}</div>
        <div class="bhpc-bccode">${esc(p.uhid)}</div>
      </div>
    </div>
  </div>`;
};

// Open a print window containing just the card, centred on the page.
export const printPatientCard = (patient, hospital) => {
  const p = readPatient(patient);
  const inner = getPatientCardInnerHTML(patient, hospital);
  const win = window.open('', '_blank', 'width=640,height=520');
  if (!win) return;
  win.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8">
    <title>Patient Card - ${esc(p.uhid)}</title>
    <style>
      @page{size:auto;margin:14mm;}
      html,body{margin:0;padding:0;background:#fff;}
      body{display:flex;align-items:center;justify-content:center;min-height:100vh;}
      @media print{body{min-height:auto;}}
    </style></head><body>${inner}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
};

// Load a (possibly cross-origin) image into a PNG data URL via canvas. Resolves
// null on any failure (CORS taint, 404) so the PDF can fall back to text.
const loadImageData = (url) => new Promise((resolve) => {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth || 120;
        c.height = img.naturalHeight || 120;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve({ data: c.toDataURL('image/png'), w: c.width, h: c.height });
      } catch { resolve(null); }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  } catch { resolve(null); }
});

// Build a card-sized PDF (mirrors the on-screen design) and trigger download.
export const downloadPatientCardPDF = async (patient, hospital) => {
  const p = readPatient(patient);
  const h = readHospital(hospital);

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [130, 82] });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Card background + border
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, W, H, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(0.5, 0.5, W - 1, H - 1);

  // Header band + violet accent strip
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 18, 'F');
  doc.setFillColor(139, 92, 246);
  doc.rect(0, 18, W, 1.4, 'F');

  // Logo (image if loadable, otherwise an initials chip)
  let logoOk = false;
  if (h.logo) {
    const img = await loadImageData(h.logo);
    if (img) {
      try { doc.addImage(img.data, 'PNG', 6, 4, 11, 11); logoOk = true; } catch { logoOk = false; }
    }
  }
  if (!logoOk) {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(6, 4, 11, 11, 1.6, 1.6, 'F');
    doc.setTextColor(76, 29, 149);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(p.initials, 11.5, 11.3, { align: 'center' });
  }

  // Hospital identity
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(doc.splitTextToSize(h.name, W - 30)[0], 21, 9.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(199, 210, 254);
  doc.text('PATIENT IDENTIFICATION CARD', 21, 14.5);

  // Avatar circle with initials
  doc.setFillColor(237, 233, 254);
  doc.circle(18, 40, 11, 'F');
  doc.setTextColor(76, 29, 149);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(p.initials, 18, 42.2, { align: 'center' });

  // Name
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(doc.splitTextToSize(p.fullName, W - 40)[0], 34, 31);

  // UHID
  doc.setFontSize(7);
  doc.setTextColor(124, 58, 237);
  doc.text('UHID', 34, 37.5);
  doc.setFont('courier', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 27, 75);
  doc.text(p.uhid, 34, 43.5);

  // Field grid (3 columns x 2 rows)
  const cols = [34, 74, 104];
  const field = (x, y, label, val, red) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text(label.toUpperCase(), x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (red) doc.setTextColor(220, 38, 38); else doc.setTextColor(15, 23, 42);
    doc.text(String(val || '—'), x, y + 4.5);
  };
  field(cols[0], 54, 'Age', p.age);
  field(cols[1], 54, 'Gender', p.gender);
  field(cols[2], 54, 'Blood Group', p.blood, true);
  field(cols[0], 64, 'Date of Birth', p.dob);
  field(cols[1], 64, 'Mobile', p.mobile);
  field(cols[2], 64, 'Marital', p.marital);

  // Footer band
  doc.setFillColor(248, 250, 252);
  doc.rect(0, H - 12, W, 12, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(0, H - 12, W, H - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`City: ${p.city}`, 6, H - 7.5);
  doc.text(`Registered: ${p.registered}`, 6, H - 3.5);

  // Decorative barcode bottom-right
  const seed = (p.uhid.replace(/[^A-Za-z0-9]/g, '') || 'UHID');
  let bx = W - 6 - 36;
  for (let i = 0; i < 36; i++) {
    const c = seed.charCodeAt(i % seed.length) + i * 7;
    const bw = ((c % 3) + 1) * 0.32;
    doc.setFillColor(15, 23, 42);
    doc.rect(bx, H - 9.5, bw, 5, 'F');
    bx += bw + 0.55;
  }
  doc.setFont('courier', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(71, 85, 105);
  doc.text(p.uhid, W - 6, H - 2.5, { align: 'right' });

  const safeName = p.fullName.replace(/\s+/g, '_');
  doc.save(`PatientCard_${p.uhid}_${safeName}.pdf`);
};
