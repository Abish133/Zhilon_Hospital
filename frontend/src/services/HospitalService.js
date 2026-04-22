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
}

export default new HospitalService();
