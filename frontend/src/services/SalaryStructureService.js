import BaseService from './BaseService';
import apiClient from '@config/api';
import AuthService from './AuthService';

class SalaryStructureService extends BaseService {
  constructor() {
    super('/salary-structures');
  }

  async getAll(params = {}) {
    const user = AuthService.getCurrentUser();
    const queryParams = {
      ...params,
      hospital_id: user?.hospital_id
    };
    return await super.getAll(queryParams);
  }

  async getByEmployee(employeeId) {
    return await apiClient.get(`${this.endpoint}/employee/${employeeId}`);
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.create(payload);
  }

  async update(id, data) {
    return await super.update(id, data);
  }

  async delete(id) {
    return await super.delete(id);
  }
}

export default new SalaryStructureService();

