const { AuditLog } = require('../models');

const auditLogger = (actionType, entityType) => {
  return async (req, res, next) => {
    // Store original res.json
    const originalJson = res.json.bind(res);
    
    // Override res.json to capture response
    res.json = function(data) {
      // Log asynchronously after response
      setImmediate(async () => {
        try {
          // Mask sensitive data in request body
          let requestBody = req.body;
          if (requestBody && typeof requestBody === 'object') {
            requestBody = { ...requestBody };
            // Remove passwords and sensitive fields
            if (requestBody.password) delete requestBody.password;
            if (requestBody.token) delete requestBody.token;
            if (requestBody.secret) delete requestBody.secret;
          }

          await AuditLog.create({
            user_id: req.user?.id || null,
            action_type: actionType,
            entity_type: entityType,
            entity_id: req.params.id || req.body.id || null,
            request_method: req.method,
            request_url: req.originalUrl,
            request_body: req.method !== 'GET' ? requestBody : null,
            request_params: req.params,
            request_query: req.query,
            response_status: res.statusCode,
            response_body: res.statusCode < 400 ? data : null,
            ip_address: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'],
            user_agent: req.headers['user-agent'],
            session_id: req.sessionID,
            hospital_id: req.user?.hospital_id || null,
            details: generateDetails(actionType, entityType, req, data)
          });
        } catch (error) {
          console.error('Audit log error:', error);
          // Don't throw - logging failure shouldn't break the app
        }
      });
      
      // Call original res.json
      return originalJson(data);
    };
    
    next();
  };
};

function generateDetails(actionType, entityType, req, response) {
  // Generate human-readable description
  if (actionType === 'CREATE') {
    const id = response?.data?.document_id || response?.data?.shift_id || 
               response?.data?.roster_id || response?.data?.structure_id || 
               response?.data?.payroll_id || response?.data?.id || req.body.id;
    return `Created ${entityType}${id ? ` (ID: ${id})` : ''}`;
  } else if (actionType === 'UPDATE') {
    const id = req.params.id || req.body.id;
    return `Updated ${entityType}${id ? ` (ID: ${id})` : ''}`;
  } else if (actionType === 'DELETE') {
    const id = req.params.id;
    return `Deleted ${entityType}${id ? ` (ID: ${id})` : ''}`;
  } else if (actionType === 'VIEW') {
    return `Viewed ${entityType}`;
  }
  return `${actionType} ${entityType}`;
}

// Global audit middleware: auto-derives entityType from URL and actionType from HTTP method.
// Logs every mutation (POST/PUT/PATCH/DELETE) across all /api routes. Skips GETs to avoid noise.
const globalAuditLogger = async (req, res, next) => {
  if (req.method === 'GET' || req.method === 'OPTIONS') return next();

  const pathSegments = (req.baseUrl + req.path).replace(/^\/api\//, '').split('/').filter(Boolean);
  const entityType = pathSegments[0] || 'unknown';

  let actionType;
  switch (req.method) {
    case 'POST': actionType = 'CREATE'; break;
    case 'PUT':
    case 'PATCH': actionType = 'UPDATE'; break;
    case 'DELETE': actionType = 'DELETE'; break;
    default: actionType = req.method;
  }

  const originalJson = res.json.bind(res);
  res.json = function (data) {
    setImmediate(async () => {
      try {
        let requestBody = req.body;
        if (requestBody && typeof requestBody === 'object') {
          requestBody = { ...requestBody };
          if (requestBody.password) delete requestBody.password;
          if (requestBody.token) delete requestBody.token;
          if (requestBody.secret) delete requestBody.secret;
        }

        await AuditLog.create({
          user_id: req.user?.id || null,
          action_type: actionType,
          entity_type: entityType,
          entity_id: req.params.id || req.body?.id || null,
          request_method: req.method,
          request_url: req.originalUrl,
          request_body: requestBody,
          request_params: req.params,
          request_query: req.query,
          response_status: res.statusCode,
          response_body: res.statusCode < 400 ? data : null,
          ip_address: req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'],
          user_agent: req.headers['user-agent'],
          session_id: req.sessionID,
          hospital_id: req.user?.hospital_id || null,
          details: generateDetails(actionType, entityType, req, data)
        });
      } catch (error) {
        console.error('Audit log error:', error.message);
      }
    });
    return originalJson(data);
  };
  next();
};

module.exports = auditLogger;
module.exports.auditLogger = auditLogger;
module.exports.globalAuditLogger = globalAuditLogger;
