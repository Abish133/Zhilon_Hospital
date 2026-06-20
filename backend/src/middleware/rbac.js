const VALID_ROLES = ['Admin', 'Doctor', 'Nurse', 'Pharmacist', 'LabTech', 'Radiologist', 'Receptionist', 'Accountant', 'HR', 'Employee'];

const normalizeRole = (role) => {
  if (!role) return '';
  const r = String(role).trim().toLowerCase();
  const map = {
    admin: 'Admin', doctor: 'Doctor', nurse: 'Nurse',
    pharmacist: 'Pharmacist', labtech: 'LabTech', 'lab tech': 'LabTech',
    radiologist: 'Radiologist', receptionist: 'Receptionist',
    accountant: 'Accountant', hr: 'HR', employee: 'Employee'
  };
  return map[r] || role;
};

const authorize = (...allowedRoles) => {
  // Support both authorize('Doctor','Nurse') and authorize(['Doctor','Nurse'])
  const allowed = allowedRoles.flat().map(normalizeRole);
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const role = normalizeRole(req.user.role);
    if (!role) {
      return res.status(403).json({ success: false, message: 'User has no role assigned' });
    }
    if (role === 'Admin') return next();
    // An empty `allowed` list means "Admin-only" (Admin already returned above).
    // Previously this was guarded by `allowed.length &&`, which made authorize([])
    // fall through to next() and silently allow EVERY authenticated role — so the
    // "Admin-only" gates (hospital writes, audit log, admin jobs) were open to all.
    if (!allowed.includes(role)) {
      return res.status(403).json({
        success: false,
        message: allowed.length
          ? `Access denied. Required role(s): ${allowed.join(', ')}`
          : 'Access denied. Administrator only.'
      });
    }
    next();
  };
};

const enforceHospitalScope = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (!req.user.hospital_id) {
    return res.status(403).json({ success: false, message: 'No hospital context on user' });
  }
  req.hospitalId = req.user.hospital_id;

  // For GET requests, force hospital_id into the query so list/report endpoints
  // are tenant-scoped. NOTE: in Express 5 `req.query` is a read-only getter, so
  // mutating `req.query.hospital_id` directly is silently discarded. We must
  // redefine `req.query` as an own data property for the value to persist.
  if (req.method === 'GET') {
    const scopedQuery = { ...req.query, hospital_id: req.user.hospital_id };
    Object.defineProperty(req, 'query', {
      value: scopedQuery,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  // For POST/PUT/PATCH, enforce hospital_id in body (req.body is writable)
  else if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      req.body.hospital_id = req.user.hospital_id;
    }
  }
  next();
};

module.exports = { authorize, enforceHospitalScope, normalizeRole, VALID_ROLES };
