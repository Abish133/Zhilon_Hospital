import apiClient from '@config/api';

class MedicalHistoryService {
    constructor() {
        this.endpoint = '/patient-medical-history';
    }

    // Get all departments
    getAll() {
        return apiClient.get(this.endpoint);
    }

    // Get department by ID
    getById(history_id) {
        return apiClient.get(`${this.endpoint}/${history_id}`);
    }

    // Create new department
    create(data) {
        return apiClient.post(this.endpoint, data);
    }

    // Update department
    update(history_id, data) {
        return apiClient.put(`${this.endpoint}/${history_id}`, data);
    }

    // Delete department
    delete(history_id) {
        return apiClient.delete(`${this.endpoint}/${history_id}`);
    }
}

export default new MedicalHistoryService();
