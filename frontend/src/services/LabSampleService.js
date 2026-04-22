import BaseService from './BaseService';
import AuthService from './AuthService';

class LabSampleService extends BaseService {
  constructor() {
    super('/lab-samples');
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id,
      collected_by: user?.id
    };
    return await super.create(payload);
  }

  async update(id, data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.update(id, payload);
  }
}

export default new LabSampleService();
