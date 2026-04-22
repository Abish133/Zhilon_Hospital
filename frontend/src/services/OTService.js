import apiClient from '@config/api';

class OTService {
  // OT Bookings
  createBooking(data) {
    return apiClient.post('/ot-bookings', data);
  }

  getBookings(params) {
    return apiClient.get('/ot-bookings', { params });
  }

  getBookingById(id) {
    return apiClient.get(`/ot-bookings/${id}`);
  }

  updateBooking(bookingId, data) {
    return apiClient.put(`/ot-bookings/${bookingId}`, data);
  }

  deleteBooking(bookingId) {
    return apiClient.delete(`/ot-bookings/${bookingId}`);
  }

  // Pre-Operative
  createPreOp(data) {
    return apiClient.post('/ot-pre-operative', data);
  }

  getPreOps(params) {
    return apiClient.get('/ot-pre-operative', { params });
  }

  getPreOpById(id) {
    return apiClient.get(`/ot-pre-operative/${id}`);
  }

  updatePreOp(id, data) {
    return apiClient.put(`/ot-pre-operative/${id}`, data);
  }

  deletePreOp(id) {
    return apiClient.delete(`/ot-pre-operative/${id}`);
  }

  // Intra-Operative
  createIntraOp(data) {
    return apiClient.post('/ot-intra-operative', data);
  }

  getIntraOps(params) {
    return apiClient.get('/ot-intra-operative', { params });
  }

  getIntraOpById(id) {
    return apiClient.get(`/ot-intra-operative/${id}`);
  }

  updateIntraOp(id, data) {
    return apiClient.put(`/ot-intra-operative/${id}`, data);
  }

  deleteIntraOp(id) {
    return apiClient.delete(`/ot-intra-operative/${id}`);
  }

  // Post-Operative
  createPostOp(data) {
    return apiClient.post('/ot-post-operative', data);
  }

  getPostOps(params) {
    return apiClient.get('/ot-post-operative', { params });
  }

  getPostOpById(id) {
    return apiClient.get(`/ot-post-operative/${id}`);
  }

  updatePostOp(id, data) {
    return apiClient.put(`/ot-post-operative/${id}`, data);
  }

  deletePostOp(id) {
    return apiClient.delete(`/ot-post-operative/${id}`);
  }

  // Consumables
  createConsumables(data) {
    return apiClient.post('/ot-consumables-used', data);
  }

  getConsumables(params) {
    return apiClient.get('/ot-consumables-used', { params });
  }

  // OT Rooms
  getRooms(params) {
    return apiClient.get('/ot-rooms', { params });
  }

  createRoom(data) {
    return apiClient.post('/ot-rooms', data);
  }

  updateRoom(id, data) {
    return apiClient.put(`/ot-rooms/${id}`, data);
  }

  deleteRoom(id) {
    return apiClient.delete(`/ot-rooms/${id}`);
  }
}

export default new OTService();
