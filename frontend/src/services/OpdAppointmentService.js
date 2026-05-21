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

  // Check in an appointment: creates the OPD visit + billing episode and
  // returns the new visit in `data.visit`. If already checked in, the backend
  // responds 409 with the existing `data.visit_id`.
  checkIn(id) {
    return apiClient.post(`${this.endpoint}/${id}/check-in`);
  }
}

export default new OpdAppointmentService();
