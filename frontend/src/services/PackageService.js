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
}
 
export default new PackageService();
 