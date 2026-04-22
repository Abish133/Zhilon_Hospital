

 
import BaseService from './BaseService';
import apiClient from '@config/api';
 
class SetAdminiChargeService extends BaseService {
  constructor() {
    super('/inventory-categories');
  }
 
  async register(data) {
    const payload = {
      ...data,
      hospital_id: 1 // Default hospital ID, modify as needed
    };
    return await this.create(payload);
  }
 
  async getAll(params = {}) {
    return await super.getAll(params);
  }
 
  async getByUHID(uhid) {
    return await apiClient.get(`${this.endpoint}/${uhid}`);
  }
 
  async update(id, data) {
    const payload = {
      ...data,
      hospital_id: 1
    };
    return await super.update(id, payload);
  }
 
  async searchCategories(query) {
    return await this.search(query);
  }
}
 
export default new SetAdminiChargeService();
 
 
 