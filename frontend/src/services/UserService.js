import apiClient from '@config/api';

class UserService {
  constructor() {
    this.endpoint = '/auth';
  }

  // Get all users
  getAll() {
    return apiClient.get(this.endpoint);
  }

  // Get user by ID
  getById(id) {
    return apiClient.get(`${this.endpoint}/${id}`);
  }

  // Create new user (register)
  create(data) {
    return apiClient.post(`${this.endpoint}/register`, data);
  }

  // Update user
  update(id, data) {
    return apiClient.put(`${this.endpoint}/${id}`, data);
  }

  // Delete user
  delete(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }

  // Get current user profile
  getProfile() {
    return apiClient.get(`${this.endpoint}/profile`);
  }
}

export default new UserService();
