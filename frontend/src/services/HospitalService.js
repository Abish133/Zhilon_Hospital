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
  // Let the browser set the multipart boundary — don't hardcode Content-Type.
  uploadLogo(id, file) {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient.post(`${this.endpoint}/${id}/logo`, formData);
  }
}

export default new HospitalService();
