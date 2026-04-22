import BaseService from './BaseService';
import AuthService from './AuthService';

class PreventiveMaintenanceService extends BaseService {
  constructor() {
    super('/preventive-maintenance');
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

  async getBySchedule(schedule) {
    return await this.getAll({ pm_schedule: schedule });
  }
}

export default new PreventiveMaintenanceService();