import apiClient from '@config/api';

class CalibrationLogService {
  constructor() {
    this.endpoint = '/calibration-logs';
  }

  getAll(params = {}) {
    return apiClient.get(this.endpoint, { params });
  }

  getByEquipmentId(equipmentId) {
    return apiClient.get(this.endpoint, { params: { equipment_id: equipmentId } });
  }

  getDue(days = 30) {
    return apiClient.get(`${this.endpoint}/due`, { params: { days } });
  }

  create(data) {
    return apiClient.post(this.endpoint, data);
  }

  update(id, data) {
    return apiClient.put(`${this.endpoint}/${id}`, data);
  }

  delete(id) {
    return apiClient.delete(`${this.endpoint}/${id}`);
  }
}

export default new CalibrationLogService();
