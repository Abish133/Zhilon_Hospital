import BaseService from './BaseService';
import apiClient from '@config/api';

class OPDService extends BaseService {
  constructor() {
    super('/opd-appointments');
  }

  async getAll(params = {}) {
    return apiClient.get('/opd-appointments', { params });
  }

  async createAppointment(data) {
    return apiClient.post('/opd-appointments', data);
  }

  async checkIn(visitId) {
    return apiClient.post(`/opd-visits/${visitId}/checkin`);
  }

  async recordVitals(visitId, data) {
    return apiClient.post('/opd-vitals', { ...data, visit_id: visitId });
  }

  async addConsultation(visitId, data) {
    return apiClient.post('/opd-consultations', { ...data, visit_id: visitId });
  }

  async getDoctorQueue(doctorId, params = {}) {
    return apiClient.get(`/opd-appointments/doctor/${doctorId}`, { params });
  }

  async getByPatient(uhid) {
    return apiClient.get(`/opd-appointments/patient/${uhid}`);
  }
}

export default new OPDService();
