import apiClient from '@config/api';
import AuthService from './AuthService';

class PatientMedicationHistoryService {
  async getAll() {
    return await apiClient.get('patient-medication-history');
  }

  async getByPatientId(patientId) {
    return await apiClient.get(`patient-medication-history/patient/${patientId}`);
  }

  async getById(id) {
    return await apiClient.get(`patient-medication-history/${id}`);
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await apiClient.post('patient-medication-history', payload);
  }

  async update(id, data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await apiClient.put(`patient-medication-history/${id}`, payload);
  }

  async delete(id) {
    return await apiClient.delete(`patient-medication-history/${id}`);
  }
}

export default new PatientMedicationHistoryService();