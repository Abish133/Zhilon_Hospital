import BaseService from './BaseService';
import AuthService from './AuthService';

class LabResultService extends BaseService {
  constructor() {
    super('/lab-results');
  }

  async create(data) {
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id,
      entered_by: user?.id,
      entered_at: new Date()
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

export default new LabResultService();
