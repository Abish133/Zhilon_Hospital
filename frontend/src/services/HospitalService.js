import apiClient from '@config/api';

class HospitalService {
  constructor() {
    this.endpoint = '/hospitals';
  }

  getAll() {
    return apiClient.get(this.endpoint);
  }

  getById(id) {
    return apiClient.get(`${this.endpoint}/${id}`);
  }

  update(id, data) {
    return apiClient.put(`${this.endpoint}/${id}`, data);
  }

  // Upload a hospital logo (PNG/JPG). Returns { logo_url, hospital }.
  // Force multipart so axios doesn't coerce the FormData to JSON (the instance
  // default Content-Type is application/json); the browser fills in the boundary.
  uploadLogo(id, file) {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient.post(`${this.endpoint}/${id}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}

export default new HospitalService();
