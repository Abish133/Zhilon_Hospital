import BaseService from './BaseService';
import AuthService from './AuthService';
import apiClient from '@config/api';

class OpdPrescriptionService extends BaseService {
  constructor() {
    super('/opd-prescriptions');
  }

  async getByPatientId(patientId) {
    return await apiClient.get(`${this.endpoint}/patient/${patientId}`);
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.create(payload);
  }

  async update(id, data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.update(id, payload);
  }
}

export default new OpdPrescriptionService();
