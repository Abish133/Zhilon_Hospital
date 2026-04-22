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
    if (allowed.length && !allowed.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowed.join(', ')}`
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
  
  // For GET requests, enforce hospital_id in query
  if (req.method === 'GET') {
    req.query.hospital_id = req.user.hospital_id;
  } 
  // For POST/PUT/PATCH, enforce hospital_id in body
  else if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
      req.body.hospital_id = req.user.hospital_id;
    }
  }
  next();
};

module.exports = { authorize, enforceHospitalScope, normalizeRole, VALID_ROLES };
