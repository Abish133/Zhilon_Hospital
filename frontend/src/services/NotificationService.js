import BaseService from './BaseService';
import apiClient from '@config/api';

class NotificationService extends BaseService {
  constructor() {
    super('/notifications');
  }

  getUnread() {
    return apiClient.get(`${this.endpoint}/unread`);
  }

  markAsRead(notificationId) {
    return apiClient.put(`${this.endpoint}/${notificationId}/read`);
  }

  markAllAsRead() {
    return apiClient.put(`${this.endpoint}/read-all`);
  }

  getAlerts() {
    return apiClient.get(`${this.endpoint}/alerts`);
  }
}

export default new NotificationService();
