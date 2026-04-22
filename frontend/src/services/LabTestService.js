import BaseService from './BaseService';
import AuthService from './AuthService';

class LabTestService extends BaseService {
  constructor() {
    super('/lab-tests');
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
    const user = AuthService.getCurrentUser();
    const payload = {
      ...data,
      hospital_id: user?.hospital_id
    };
    return await super.update(id, payload);
  }
}

export default new LabTestService();
