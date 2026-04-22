import BaseService from './BaseService';
import apiClient from '@config/api';

class RadiologyImagingService extends BaseService {
  constructor() {
    super('/radiology-imaging');
  }

  getByOrderId(orderId) {
    return apiClient.get(`${this.endpoint}`, { params: { rad_order_id: orderId } });
  }

  uploadImages(imagingId, formData) {
    return apiClient.post(`${this.endpoint}/${imagingId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
}

export default new RadiologyImagingService();
