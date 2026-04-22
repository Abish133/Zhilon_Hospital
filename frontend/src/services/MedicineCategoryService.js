import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';
 
class MedicineCategoryService extends BaseService {
  constructor() {
    super('/medicine_category');
  }
 
  async register(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
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
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.update(id, payload);
  }
 
  async searchCategories(query) {
    return await this.search(query);
  }
 
  async getByCode(code) {
    return await apiClient.get(`${this.endpoint}/code/${code}`);
  }
 
  async getByCategory(category) {
    return await apiClient.get(`${this.endpoint}/category/${category}`);
  }
}
 
export default new MedicineCategoryService();
 
 
 