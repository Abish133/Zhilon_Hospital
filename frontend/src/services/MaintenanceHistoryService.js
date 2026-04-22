import BaseService from './BaseService';
import AuthService from './AuthService';

class MaintenanceHistoryService extends BaseService {
  constructor() {
    super('/maintenance-history');
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
    return await super.update(id, data);
  }

  async delete(id) {
    return await super.delete(id);
  }

  async getByEquipment(equipmentId) {
    return await this.getAll({ equipment_id: equipmentId });
  }

  async getByMaintenanceType(type) {
    return await this.getAll({ maintenance_type: type });
  }
}

export default new MaintenanceHistoryService();