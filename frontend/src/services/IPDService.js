import BaseService from './BaseService';
import apiClient from '@config/api';

class IPDService extends BaseService {
  constructor() {
    super('/ipd');
  }

  async getAll(params = {}) {
    return apiClient.get('/ipd-admissions', { params });
  }

  async admitPatient(data) {
    return apiClient.post('/ipd-admissions', data);
  }

  async addProgressNote(admissionId, data) {
    return apiClient.post(`/ipd-progress-notes`, { ...data, admission_id: admissionId });
  }

  async dischargePatient(admissionId, data) {
    return apiClient.post(`/ipd-admissions/${admissionId}/discharge`, data);
  }

  async getBedAvailability() {
    return apiClient.get('/beds/availability');
  }

  async getByPatient(uhid) {
    return apiClient.get(`/ipd-admissions/patient/${uhid}`);
  }
}

export default new IPDService();
