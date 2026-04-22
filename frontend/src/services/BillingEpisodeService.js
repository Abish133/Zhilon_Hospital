import BaseService from './BaseService';
import apiClient from '@config/api';

class BillingEpisodeService extends BaseService {
  constructor() {
    super('/billing-episodes');
  }

  getByPatient(patientId) {
    return this.getAll({ patient_id: patientId });
  }

  getByType(episodeType) {
    return this.getAll({ episode_type: episodeType });
  }

  getByStatus(status) {
    return this.getAll({ status });
  }

  // Get episode with patient details
  getEpisodeDetails(episodeId) {
    return apiClient.get(`${this.endpoint}/${episodeId}`);
  }

  // Close episode
  closeEpisode(episodeId) {
    return apiClient.put(`${this.endpoint}/${episodeId}/close`);
  }
}

export default new BillingEpisodeService();