import apiClient from '@config/api';

class DoctorQualificationService {
  constructor() {
    this.endpoint = '/doctor-qualifications';
  }

  getAll(params = {}) {
    return apiClient.get(this.endpoint, { params });
  }

  getByDoctorId(doctorId) {
    return apiClient.get(this.endpoint, { params: { doctor_id: doctorId } });
  }

  create(data) {
    return apiClient.post(this.endpoint, data);
  }

  update(id, data) {
    return apiClient.put(`${this.endpoint}/${id}`, data);
  }

  delete(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }
}

export default new DoctorQualificationService();
