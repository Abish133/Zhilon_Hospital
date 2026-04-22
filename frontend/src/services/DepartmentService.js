import apiClient from '@config/api';
import AuthService from './AuthService';

class DepartmentService {
    constructor() {
        this.endpoint = '/departments';
    }

    // Get all departments
    getAll() {
        return apiClient.get(this.endpoint);
    }

    // Get department by ID
    getById(id) {
        return apiClient.get(`${this.endpoint}/${id}`);
    }

    // Create new department
    create(data) {
        const user = AuthService.getCurrentUser();
        const payload = {
            ...data,
            hospital_id: user?.hospital_id
        };
        return apiClient.post(this.endpoint, payload);
    }

    // Update department
    update(id, data) {
        const user = AuthService.getCurrentUser();
        const payload = {
            ...data,
            hospital_id: user?.hospital_id
        };
        return apiClient.put(`${this.endpoint}/${id}`, payload);
    }

    // Delete department
    delete(id) {
        return apiClient.delete(`${this.endpoint}/${id}`);
    }
}

export default new DepartmentService();
