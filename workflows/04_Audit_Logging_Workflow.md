# Audit Logging - Workflow

## Overview
This workflow describes the system audit logging mechanism that tracks all user actions for security and compliance.

## User Roles
- Admin: Can view all audit logs
- System: Automatically logs all actions

## Workflow Steps

### 1. Automatic Logging

```
1. User performs any action (Create/Update/Delete)
   └─> Request goes through auditLogger middleware
   
2. Middleware captures:
   - User ID (from req.user)
   - Action type (CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT)
   - Entity type (Patient, OPD, IPD, Billing, etc.)
   - Entity ID (if applicable)
   - Request details (body, params, query)
   - IP address (req.ip)
   - User agent (req.headers['user-agent'])
   - Timestamp
   - Response status code
   
3. After response is sent:
   └─> Middleware creates AuditLog record asynchronously
   └─> Doesn't block response
   └─> Logs to database
```

### 2. Viewing Audit Logs

```
1. Admin navigates to Audit Logs page
2. Admin applies filters:
   - Date range
   - User
   - Action type
   - Entity type
   - IP address (optional)
   
3. Admin clicks "Search"
   └─> GET /api/audit-logs
   └─> Returns filtered logs
   
4. UI displays:
   - Table with columns: Timestamp, User, Action, Entity, Details, IP
   - Pagination
   - Export options (CSV, PDF)
```

### 3. Detailed Log View

```
1. Admin clicks on log entry
   └─> Modal opens with full details
   
2. Shows:
   - Complete request details
   - Response details
   - Before/After values (for updates)
   - Full user agent string
   - Session information
```

## Database Schema

### Table: audit_logs
- log_id (PK)
- user_id (FK → users, nullable - for system actions)
- action_type (ENUM: CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT, EXPORT, PRINT)
- entity_type (VARCHAR) - e.g., "Patient", "OPD", "Billing"
- entity_id (INTEGER, nullable)
- request_method (VARCHAR) - GET, POST, PUT, DELETE
- request_url (VARCHAR)
- request_body (JSON, nullable)
- request_params (JSON, nullable)
- request_query (JSON, nullable)
- response_status (INTEGER)
- response_body (JSON, nullable)
- ip_address (VARCHAR)
- user_agent (TEXT)
- session_id (VARCHAR, nullable)
- hospital_id (FK, nullable)
- details (TEXT) - Human-readable description
- created_at (TIMESTAMP)

## API Endpoints

### GET /api/audit-logs
**Query Parameters:**
- from_date (DATE)
- to_date (DATE)
- user_id (INTEGER)
- action_type (ENUM)
- entity_type (VARCHAR)
- entity_id (INTEGER)
- ip_address (VARCHAR)
- hospital_id (INTEGER)
- page (INTEGER, default: 1)
- limit (INTEGER, default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "log_id": 1,
      "user_id": 5,
      "user": {
        "username": "admin",
        "email": "admin@hospital.com"
      },
      "action_type": "CREATE",
      "entity_type": "Patient",
      "entity_id": 123,
      "request_method": "POST",
      "request_url": "/api/patients",
      "ip_address": "192.168.1.10",
      "details": "Created patient UHID-2025-00001",
      "created_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

### GET /api/audit-logs/:id
**Response:** Full log details including request/response bodies

### POST /api/audit-logs/export
**Query:** Same filters as GET
**Response:** CSV/PDF file download

## Middleware Implementation

### File: backend/src/middleware/auditLogger.js

```javascript
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
          await AuditLog.create({
            user_id: req.user?.id || null,
            action_type: actionType,
            entity_type: entityType,
            entity_id: req.params.id || req.body.id || null,
            request_method: req.method,
            request_url: req.originalUrl,
            request_body: req.method !== 'GET' ? req.body : null,
            request_params: req.params,
            request_query: req.query,
            response_status: res.statusCode,
            response_body: data,
            ip_address: req.ip || req.connection.remoteAddress,
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
    return `Created ${entityType} ${response?.data?.id || ''}`;
  } else if (actionType === 'UPDATE') {
    return `Updated ${entityType} ${req.params.id || ''}`;
  } else if (actionType === 'DELETE') {
    return `Deleted ${entityType} ${req.params.id || ''}`;
  }
  return `${actionType} ${entityType}`;
}

module.exports = auditLogger;
```

## Usage in Routes

```javascript
const auditLogger = require('../middleware/auditLogger');
const PatientController = require('../controllers/PatientController');

router.post('/', 
  authenticate, 
  auditLogger('CREATE', 'Patient'), 
  PatientController.create
);

router.put('/:id', 
  authenticate, 
  auditLogger('UPDATE', 'Patient'), 
  PatientController.update
);

router.delete('/:id', 
  authenticate, 
  auditLogger('DELETE', 'Patient'), 
  PatientController.delete
);
```

## Sensitive Actions to Log

### High Priority (Always Log)
- User login/logout
- Patient creation/update/deletion
- Billing operations
- Payment processing
- Refund processing
- User management (create/update/delete users)
- Role/permission changes
- System settings changes

### Medium Priority
- OPD/IPD admissions
- Prescription generation
- Lab/radiology orders
- Equipment maintenance
- Inventory transactions

### Low Priority (Optional)
- View operations (can be filtered)
- Search operations

## Security Considerations

1. **Performance**: Logging is asynchronous and doesn't block requests
2. **Storage**: Consider log rotation/archival for old logs
3. **Privacy**: Mask sensitive data (passwords, SSN, etc.) in logs
4. **Access Control**: Only admins can view audit logs
5. **Retention**: Define retention policy (e.g., 2 years)

## Log Retention & Archival

```
1. System runs daily job to archive old logs
   └─> Logs older than 1 year moved to archive table
   
2. System runs monthly job to delete very old logs
   └─> Logs older than retention period deleted
   
3. Critical logs (user management, billing) kept longer
```

## Export & Reporting

1. **CSV Export**: For analysis in Excel
2. **PDF Export**: For compliance reports
3. **Scheduled Reports**: Email daily/weekly summaries to admin

