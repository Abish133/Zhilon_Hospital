import BaseService from './BaseService';
import apiClient from '@config/api';

class IPDService extends BaseService {
  constructor() {
    super('/ipd');
  }

  async getAll(params = {}) {
    return apiClient.get('/api/ipd-admissions', { params });
  }

  async admitPatient(data) {
    return apiClient.post('/api/ipd-admissions', data);
  }

  async addProgressNote(admissionId, data) {
    return apiClient.post(`/api/ipd-progress-notes`, { ...data, admission_id: admissionId });
  }

  async dischargePatient(admissionId, data) {
    return apiClient.post(`/api/ipd-admissions/${admissionId}/discharge`, data);
  }

  async getBedAvailability() {
    return apiClient.get('/api/beds/availability');
  }

  async getByPatient(uhid) {
    return apiClient.get(`/api/ipd-admissions/patient/${uhid}`);
  }
}

export default new IPDService();
