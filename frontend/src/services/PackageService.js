import BaseService from './BaseService';
import apiClient from '@config/api';
 
class PackageService extends BaseService {
  constructor() {
    super('/packages');
  }
 
  async register(data) {
    const payload = {
      ...data,
      hospital_id: 1
    };
    return await this.create(payload);
  }
 
  async getAll(params = {}) {
    return await super.getAll(params);
  }
 
  async getByID(id) {
    return await apiClient.get(`${this.endpoint}/${id}`);
  }
 
  async update(id, data) {
    const payload = {
      ...data,
      hospital_id: 1
    };
    return await super.update(id, payload);
  }
 
  async search(query) {
    return await super.search(query);
  }

  // Apply this package to an open billing episode — posts a single bundled BillCharge.
  async applyToEpisode(packageId, { episode_id, discount_percent = 0 }) {
    return (await apiClient.post(`${this.endpoint}/${packageId}/apply`, {
      episode_id,
      discount_percent
    })).data;
  }
}
 
export default new PackageService();
 