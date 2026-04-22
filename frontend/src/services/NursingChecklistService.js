import apiClient from '@config/api';
import BaseService from './BaseService';

class NursingChecklistService extends BaseService {
  constructor() {
    super('/nursing-checklists');
  }

  template() {
    return apiClient.get(`${this.endpoint}/template`);
  }
}

export default new NursingChecklistService();
