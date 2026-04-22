# Patient Document Management - Workflow

## Overview
This workflow describes the complete process for managing patient documents including upload, storage, retrieval, and deletion.

## User Roles
- Receptionist: Can upload/view documents
- Doctor: Can upload/view documents

- Admin: Full access (upload/view/delete)

## Workflow Steps

### 1. Document Upload Flow

```
1. User navigates to Patient Detail page
   └─> Clicks on "Documents" tab
   
2. User clicks "Upload Document" button
   └─> Modal opens with upload form
   
3. User fills form:
   - Selects document type (ID Proof, Lab Report, Insurance Form, Prescription, etc.)
   - Selects file (PDF, Image, Document)
   - Optional: Adds description
   
4. User clicks "Upload"
   └─> Frontend validates file (size, type)
   └─> Creates FormData with file and metadata
   └─> Sends POST request to /api/patient-documents/upload
   
5. Backend processes:
   └─> Multer middleware saves file to /uploads/patient-documents/
   └─> Creates database record in patient_documents table
   └─> Returns document record
   
6. Frontend updates UI:
   └─> Shows success message
   └─> Refreshes document list
   └─> Displays new document in table
```

### 2. Document View/Download Flow

```
1. User views document list
   └─> Table shows: Document Type, Filename, Upload Date, Uploaded By
   
2. User clicks "Download" button
   └─> Frontend sends GET request to /api/patient-documents/:id/download
   
3. Backend:
   └─> Validates document exists and user has access
   └─> Reads file from disk
   └─> Returns file as download response
   
4. Frontend:
   └─> Browser downloads file with original filename
```

### 3. Document Deletion Flow

```
1. User clicks "Delete" button on document
   └─> Confirmation dialog appears
   
2. User confirms deletion
   └─> Frontend sends DELETE request to /api/patient-documents/:id
   
3. Backend:
   └─> Validates user has permission (Admin only)
   └─> Deletes file from disk
   └─> Soft deletes record (sets is_active = false) OR hard deletes
   └─> Returns success response
   
4. Frontend:
   └─> Shows success message
   └─> Removes document from list
```

## File Storage Structure

```
backend/
└── uploads/
    └── patient-documents/
        ├── doc-1234567890-123456789.pdf
        ├── doc-1234567891-123456790.jpg
        └── ...
```

## Database Schema

**Table: patient_documents**
- document_id (PK)
- patient_id (FK → patients)
- document_type (VARCHAR)
- filename (VARCHAR) - stored filename
- original_filename (VARCHAR) - original filename
- file_path (VARCHAR) - full path to file
- file_size (INTEGER) - bytes
- mime_type (VARCHAR)
- uploaded_by (FK → users)
- hospital_id (FK → hospitals)
- description (TEXT)
- is_active (BOOLEAN)
- createdAt, updatedAt

## API Endpoints

### POST /api/patient-documents/upload
**Request:**
- Content-Type: multipart/form-data
- Body: file, patient_id, document_type, description (optional)

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "document_id": 1,
    "patient_id": 123,
    "document_type": "ID Proof",
    "filename": "doc-1234567890-123456789.pdf",
    "original_filename": "aadhar_card.pdf",
    ...
  }
}
```

### GET /api/patient-documents/patient/:patientId
**Query Params:**
- document_type (optional) - filter by type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "document_id": 1,
      "document_type": "ID Proof",
      "original_filename": "aadhar_card.pdf",
      "file_size": 245678,
      "uploaded_by": {
        "id": 5,
        "username": "receptionist1"
      },
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/patient-documents/:id/download
**Response:** File download (binary)

### DELETE /api/patient-documents/:id
**Response:**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

## Error Handling

1. **File too large**: Return 400 with message "File size exceeds 10MB limit"
2. **Invalid file type**: Return 400 with message "Only image, PDF, and document files are allowed"
3. **Patient not found**: Return 404
4. **Permission denied**: Return 403
5. **File not found on disk**: Return 404 with message "File not found on server"

## Security Considerations

1. File upload validation (type, size)
2. Access control based on user role
3. Hospital isolation (users can only access their hospital's documents)
4. File path sanitization to prevent directory traversal
5. Virus scanning (optional, for production)

 