import apiClient from '@config/api';
import BaseService from './BaseService';

class EmployeeAttendanceService extends BaseService {
  constructor() {
    super('/employee-attendance');
  }

  getToday() {
    return apiClient.get(`${this.endpoint}/today`);
  }

  checkIn() {
    return apiClient.post(`${this.endpoint}/check-in`);
  }

  checkOut() {
    return apiClient.post(`${this.endpoint}/check-out`);
  }

  listByDate(date) {
    return apiClient.get(this.endpoint, { params: { date } });
  }
}

export default new EmployeeAttendanceService();
