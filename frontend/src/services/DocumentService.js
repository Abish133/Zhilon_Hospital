import BaseService from './BaseService';
import apiClient from '@config/api';

class DocumentService extends BaseService {
  constructor() {
    super('/patient-documents');
  }

  // Upload a patient document. `meta` must include patient_id and document_type;
  // description is optional. Backend reads these as flat fields, not a JSON blob.
  upload(file, meta = {}) {
    const { patient_id, document_type, description } = meta;
    const formData = new FormData();
    formData.append('file', file);
    if (patient_id != null) formData.append('patient_id', patient_id);
    if (document_type) formData.append('document_type', document_type);
    if (description) formData.append('description', description);
    // Force multipart so axios doesn't coerce the FormData to JSON (the instance
    // default Content-Type is application/json); the browser fills in the boundary.
    return apiClient.post(`${this.endpoint}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  download(documentId) {
    return apiClient.get(`${this.endpoint}/${documentId}/download`, {
      responseType: 'blob'
    });
  }

  getByPatient(patientId, params = {}) {
    return apiClient.get(`${this.endpoint}/patient/${patientId}`, { params });
  }

  deleteDocument(documentId) {
    return this.delete(documentId);
  }
}

export default new DocumentService();
