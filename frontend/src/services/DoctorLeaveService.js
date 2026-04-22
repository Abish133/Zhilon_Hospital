import apiClient from '@config/api';

class DoctorLeaveService {
  constructor() {
    this.endpoint = '/doctor-leaves';
  }

  getAll(params = {}) {
    return apiClient.get(this.endpoint, { params });
  }

  getByDoctorId(doctorId) {
    return apiClient.get(this.endpoint, { params: { doctor_id: doctorId } });
  }

  checkAvailability(doctorId, date) {
    return apiClient.get(`${this.endpoint}/check`, {
      params: { doctor_id: doctorId, date }
    });
  }

  create(data) {
    return apiClient.post(this.endpoint, data);
  }

  updateStatus(id, status) {
    return apiClient.put(`${this.endpoint}/${id}/status`, { status });
  }

  delete(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }
}

export default new DoctorLeaveService();
