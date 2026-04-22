import apiClient from '@config/api';
import AuthService from './AuthService';

class PatientMedicalHistoryService {
  async getAll() {
    return await apiClient.get('/patient-medical-history');
  }

  async getByPatientId(patientId) {
    return await apiClient.get(`/patient-medical-history/patient/${patientId}`);
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await apiClient.post('/patient-medical-history', payload);
  }

  async update(id, data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await apiClient.put(`/patient-medical-history/${id}`, payload);
  }

  async delete(id) {
    return await apiClient.delete(`/patient-medical-history/${id}`);
  }

  async search(query) {
    return await apiClient.get(`/patient-medical-history?search=${query}`);
  }
}

export default new PatientMedicalHistoryService();
