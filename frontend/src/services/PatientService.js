import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';
 
class PatientService extends BaseService {
  constructor() {
    super('/patients');
  }
 
  async register(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await this.create(payload);
  }
 
  async getAll(params = {}) {
    return await super.getAll(params);
  }
 
  async getByUHID(uhid) {
    return await apiClient.get(`${this.endpoint}/${uhid}`);
  }

  async getByUhid(uhid) {
    return await apiClient.get(`${this.endpoint}/${uhid}`);
  }
 
  async update(id, data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.update(id, payload);
  }
 
  async searchPatients(query) {
    return await this.search(query);
  }

  async getAdmissions() {
    return await apiClient.get('/ipd-admissions');
  }
}
 
export default new PatientService();
 
 
 