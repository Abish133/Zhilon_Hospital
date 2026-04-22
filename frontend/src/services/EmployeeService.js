import BaseService from './BaseService';
import apiClient from '@config/api';

class EmployeeService extends BaseService {
  constructor() {
    super('/employees');
  }

  addDoctor(data) {
    return this.create(data);
  }

  setDoctorSchedule(doctorId, data) {
    return apiClient.post(`/doctors/${doctorId}/schedule`, data);
  }

  getDoctorEmployees(hospitalId) {
    return apiClient.get('/doctors/employees/dropdown', { params: { hospital_id: hospitalId } });
  }
}

export default new EmployeeService();
