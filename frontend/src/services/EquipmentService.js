import BaseService from './BaseService';
import AuthService from './AuthService';

class EquipmentService extends BaseService {
  constructor() {
    super('/equipment');
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.create(payload);
  }

  async getAll(params = {}) {
    return await super.getAll(params);
  }

  async getById(id) {
    return await super.getById(id);
  }

  async update(id, data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.update(id, payload);
  }

  async delete(id) {
    return await super.delete(id);
  }

  async searchEquipment(query) {
    return await this.search(query);
  }

  async getByStatus(status) {
    return await this.getAll({ status });
  }

  async getByDepartment(departmentId) {
    return await this.getAll({ department_id: departmentId });
  }

  async getByType(equipmentType) {
    return await this.getAll({ equipment_type: equipmentType });
  }
}

export default new EquipmentService();