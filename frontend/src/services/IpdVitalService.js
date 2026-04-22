import apiClient from '@config/api';

class IpdVitalService {
  recordVitals(data) {
    return apiClient.post('/ipd-vitals', data);
  }

  getVitalsByAdmission(admissionId) {
    return apiClient.get(`/ipd-vitals/admission/${admissionId}`);
  }

  getVitalsByDate(admissionId, date) {
    return apiClient.get(`/ipd-vitals/admission/${admissionId}/date/${date}`);
  }
}

export default new IpdVitalService();
