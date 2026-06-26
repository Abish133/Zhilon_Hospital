import apiClient from '@config/api';

class AuthService {
  async login(credentials) {
    // Backend expects email and password
    const response = await apiClient.post('/auth/login', {
      email: credentials.email || credentials.username,
      password: credentials.password
    });
    return response;
  }

  async register(data) {
    return apiClient.post('/auth/register', data);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  changePassword(data) {
    return apiClient.post('/auth/change-password', data);
  }

  forgotPassword(email) {
    return apiClient.post('/auth/forgot-password', { email });
  }

  resetPassword(token, password) {
    return apiClient.post('/auth/reset-password', { token, password });
  }

  getProfile() {
    return apiClient.get('/auth/profile');
  }

  updateProfile(data) {
    return apiClient.put('/auth/profile', data);
  }

  getCurrentUser() {
    const user = localStorage.getItem('user');
    if (!user || user === 'undefined') return null;
    return JSON.parse(user);
  }

  setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  getToken() {
    return localStorage.getItem('token');
  }

  isAuthenticated() {
    return !!this.getToken();
  }
}

export default new AuthService();

