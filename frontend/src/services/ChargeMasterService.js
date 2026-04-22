import BaseService from './BaseService';

class ChargeMasterService extends BaseService {
  constructor() {
    super('/charge-masters');
  }

  async create(data) {
    const payload = {
      ...data,
      hospital_id: data.hospital_id
    };
    return await super.create(payload);
  }

  async update(id, data) {
    const payload = {
      ...data,
      hospital_id: data.hospital_id
    };
    return await super.update(id, payload);
  }

  async getByServiceType(serviceType) {
    return await this.getAll({ service_type: serviceType });
  }

  async getByDepartment(departmentId) {
    return await this.getAll({ department_id: departmentId });
  }
}

export default new ChargeMasterService();
