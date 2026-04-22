import apiClient from '@config/api';

class BaseService {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  // Resolve a sub-path against this.endpoint. A leading '/' or '' becomes the
  // endpoint root; everything else is joined with a single '/'.
  _url(path = '') {
    const p = path == null ? '' : String(path);
    if (!p || p === '/') return this.endpoint;
    return `${this.endpoint}${p.startsWith('/') ? p : `/${p}`}`;
  }

  // Generic HTTP shortcuts for subclasses (Insurance, etc.) that need
  // arbitrary sub-routes under their endpoint.
  get(path, config) { return apiClient.get(this._url(path), config); }
  post(path, data, config) { return apiClient.post(this._url(path), data, config); }
  put(path, data, config) { return apiClient.put(this._url(path), data, config); }
  patch(path, data, config) { return apiClient.patch(this._url(path), data, config); }
  delete(path, config) { return apiClient.delete(this._url(path), config); }

  getAll(params = {}) {
    return apiClient.get(this.endpoint, { params });
  }

  getById(id) {
    return apiClient.get(`${this.endpoint}/${id}`);
  }

  create(data) {
    return apiClient.post(this.endpoint, data);
  }

  update(id, data) {
    return apiClient.put(`${this.endpoint}/${id}`, data);
  }

  search(query) {
    return apiClient.get(`${this.endpoint}/search`, { params: { q: query } });
  }
}

export default BaseService;
