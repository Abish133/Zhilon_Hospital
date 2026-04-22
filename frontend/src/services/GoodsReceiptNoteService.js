import BaseService from './BaseService';

class GoodsReceiptNoteService extends BaseService {
  constructor() {
    super('/goods-receipt-notes');
  }
}

export default new GoodsReceiptNoteService();
