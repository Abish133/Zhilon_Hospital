const nodemailer = require('nodemailer');

// ── Multi-tenant email ────────────────────────────────────────────────────────
// Each hospital may store its own SMTP under hospitals.settings.smtp. When a
// tenant hasn't configured one, we fall back to the platform-level SMTP_* env
// vars. When neither is set, the email body (including any reset link) is printed
// to the server log so local/dev installs keep working.

const truthy = (v) => v === true || String(v).toLowerCase() === 'true';

// Derive the correct TLS mode from the port to avoid the most common SMTP
// misconfiguration: port 587 uses STARTTLS (secure=false) and port 465 uses
// implicit TLS (secure=true). A wrong `secure` flag for a standard port causes
// the connection to hang/fail, so the port wins for the well-known ports.
const resolveSecure = (port, secure) => {
  const p = Number(port);
  if (p === 465) return true;
  if (p === 587 || p === 25 || p === 2525) return false;
  return truthy(secure);
};

// Build transport options shared by env + tenant configs. requireTLS ensures a
// non-secure connection still upgrades to STARTTLS rather than sending in clear.
const transportOptions = ({ host, port, secure, user, pass }) => {
  const p = Number(port) || 587;
  const isSecure = resolveSecure(p, secure);
  return {
    host,
    port: p,
    secure: isSecure,
    requireTLS: !isSecure,
    auth: user ? { user, pass } : undefined
  };
};

// Platform-level (env) transporter, built once.
const envConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_PORT);
const envTransporter = envConfigured
  ? nodemailer.createTransport(transportOptions({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }))
  : null;

const envFrom = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@hms.local';

// Build a transporter from a per-tenant SMTP config object.
const buildTenantTransport = (smtp) => nodemailer.createTransport(transportOptions(smtp));

// Resolve which transporter + default "from" address to use for this send.
// Precedence: a tenant SMTP with a host wins; otherwise the platform env SMTP.
const resolveTransport = (smtp) => {
  if (smtp && smtp.host) {
    return { transporter: buildTenantTransport(smtp), defaultFrom: smtp.from || smtp.user || envFrom };
  }
  return { transporter: envTransporter, defaultFrom: envFrom };
};

// fromName lets us brand the sender per hospital ("Bay Hospital <no-reply@…>")
// while still using whichever account actually relays the mail.
async function sendMail({ to, subject, text, html, smtp, fromName }) {
  const { transporter, defaultFrom } = resolveTransport(smtp);

  if (!transporter) {
    console.log('📧  [mailer] No SMTP configured (tenant or env) — email not sent. Preview:');
    console.log(`    To: ${to}`);
    console.log(`    Subject: ${subject}`);
    console.log(`    ${text || ''}`);
    return { delivered: false };
  }

  const from = fromName ? { name: fromName, address: addressOf(defaultFrom) } : defaultFrom;
  await transporter.sendMail({ from, to, subject, text, html });
  return { delivered: true };
}

// Extract a bare "user@host" out of a possibly-formatted from string like
// '"HMS" <no-reply@hms.local>' so we can re-wrap it with the tenant's name.
function addressOf(from) {
  const match = /<([^>]+)>/.exec(from);
  return match ? match[1] : from;
}

async function sendPasswordResetEmail(to, name, resetUrl, { smtp, hospitalName } = {}) {
  const brand = hospitalName || 'HMS';
  const subject = `Reset your ${brand} password`;
  const text =
    `Hi ${name || ''},\n\n` +
    `We received a request to reset your ${brand} password. ` +
    `Open the link below to choose a new password. This link expires in 1 hour.\n\n` +
    `${resetUrl}\n\n` +
    `If you didn't request this, you can safely ignore this email.`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;color:#0a0a0a">
      <h2 style="margin:0 0 16px">Reset your password</h2>
      <p style="color:#444;font-size:14px;line-height:1.6">
        Hi ${name || ''}, we received a request to reset your <b>${brand}</b> password.
        Click the button below to choose a new one. This link expires in 1 hour.
      </p>
      <p style="margin:24px 0">
        <a href="${resetUrl}" style="background:#0a0a0a;color:#fff;text-decoration:none;
          padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;display:inline-block">
          Reset password
        </a>
      </p>
      <p style="color:#888;font-size:12px;line-height:1.6">
        If the button doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color:#0a0a0a">${resetUrl}</a>
      </p>
      <p style="color:#888;font-size:12px;line-height:1.6">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>`;
  return sendMail({ to, subject, text, html, smtp, fromName: brand });
}

module.exports = { sendMail, sendPasswordResetEmail, envConfigured };
