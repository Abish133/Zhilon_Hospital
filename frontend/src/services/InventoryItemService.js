import BaseService from './BaseService';

class InventoryItemService extends BaseService {
  constructor() {
    super('/inventory-items');
  }
}

export default new InventoryItemService();
