import BaseService from './BaseService';

class IpdProgressNoteService extends BaseService {
  constructor() {
    super('/ipd-progress-notes');
  }
}

export default new IpdProgressNoteService();
