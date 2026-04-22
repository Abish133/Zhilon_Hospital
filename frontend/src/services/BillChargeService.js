import BaseService from './BaseService';
import apiClient from '@config/api';

class BillChargeService extends BaseService {
  constructor() {
    super('/bill-charges');
  }

  getByEpisode(episodeId) {
    return this.getAll({ episode_id: episodeId });
  }

  getByServiceType(serviceType) {
    return this.getAll({ service_type: serviceType });
  }

  // Get charges with totals for an episode
  getEpisodeCharges(episodeId) {
    return apiClient.get(`${this.endpoint}/episode/${episodeId}`);
  }

  // Add charge from charge master
  addFromMaster(chargeData) {
    return apiClient.post(`${this.endpoint}/from-master`, chargeData);
  }

  // Delete a charge
  deleteCharge(chargeId) {
    return apiClient.delete(`${this.endpoint}/${chargeId}`);
  }
}

export default new BillChargeService();