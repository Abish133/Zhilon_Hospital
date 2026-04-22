import apiClient from '@config/api';
import AuthService from './AuthService';

class PatientClinicalHistoryService {
  async getAll() {
    return await apiClient.get('patient-clinical-history');
  }

  async getByPatientId(patientId) {
    return await apiClient.get(`patient-clinical-history/patient/${patientId}`);
  }

  async getById(id) {
    return await apiClient.get(`patient-clinical-history/${id}`);
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await apiClient.post('patient-clinical-history', payload);
  }

  async update(id, data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await apiClient.put(`patient-clinical-history/${id}`, payload);
  }

  async delete(id) {
    return await apiClient.delete(`patient-clinical-history/${id}`);
  }
}

export default new PatientClinicalHistoryService();