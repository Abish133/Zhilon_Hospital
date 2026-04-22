import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';

class OpdAppointmentService extends BaseService {
  constructor() {
    super('/opd-appointments');
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

  getByPatient(uhid) {
    return apiClient.get(`${this.endpoint}?uhid=${uhid}`);
  }

  updateStatus(id, status) {
    return apiClient.patch(`${this.endpoint}/${id}/status`, { status });
  }
}

export default new OpdAppointmentService();
