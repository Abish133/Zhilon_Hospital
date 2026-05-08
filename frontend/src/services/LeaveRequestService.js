import BaseService from './BaseService';
import apiClient from '@config/api';

class LeaveRequestService extends BaseService {
  constructor() {
    super('/leave-requests');
  }

  // Backend filters: status, employee_id, from_date, to_date.
  list(params = {}) {
    return apiClient.get(this.endpoint, { params });
  }

  // Stats endpoint returns approved-leave totals grouped by leave_type.
  getStats(params = {}) {
    return apiClient.get(`${this.endpoint}/stats`, { params });
  }

  getByEmployee(employeeId) {
    return apiClient.get(`${this.endpoint}/employee/${employeeId}`);
  }

  // Backend computes no_of_days from from_date/to_date — don't send it.
  create(payload) {
    return apiClient.post(this.endpoint, payload);
  }

  approve(id, approval_comments) {
    return apiClient.post(`${this.endpoint}/${id}/approve`, { approval_comments });
  }

  reject(id, rejection_reason) {
    return apiClient.post(`${this.endpoint}/${id}/reject`, { rejection_reason });
  }
}

export default new LeaveRequestService();
