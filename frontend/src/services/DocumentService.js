import BaseService from './BaseService';
import apiClient from '@config/api';

class DocumentService extends BaseService {
  constructor() {
    super('/documents');
  }

  upload(file, metadata) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));
    return apiClient.post(`${this.endpoint}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  download(documentId) {
    return apiClient.get(`${this.endpoint}/${documentId}/download`, {
      responseType: 'blob'
    });
  }

  getByEntity(entityType, entityId) {
    return apiClient.get(`${this.endpoint}/${entityType}/${entityId}`);
  }

  deleteDocument(documentId) {
    return this.delete(documentId);
  }
}

export default new DocumentService();
