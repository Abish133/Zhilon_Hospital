import BaseService from './BaseService';
import AuthService from './AuthService';

class MaintenanceRequestService extends BaseService {
  constructor() {
    super('/maintenance-requests');
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    
    if (!user?.id) {
      throw new Error('User not authenticated');
    }
    
    const payload = {
      ...data,
      hospital_id: user?.hospital_id,
      reported_by: user?.id
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

  async getByStatus(status) {
    return await this.getAll({ status });
  }

  async getByPriority(priority) {
    return await this.getAll({ priority });
  }

  async getByEquipment(equipmentId) {
    return await this.getAll({ equipment_id: equipmentId });
  }
}

export default new MaintenanceRequestService();