import BaseService from './BaseService';
import AuthService from './AuthService';

class DoctorScheduleService extends BaseService {
  constructor() {
    super('/doctor-schedules');
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

export default new DoctorScheduleService();
