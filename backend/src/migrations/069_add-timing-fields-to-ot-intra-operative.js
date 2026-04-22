'use strict';

const COLS = {
  surgery_start_time: { type: 'TIME' },
  surgery_end_time: { type: 'TIME' },
  anesthesia_start_time: { type: 'TIME' },
  anesthesia_end_time: { type: 'TIME' },
  urine_output_ml: { type: 'INTEGER' },
  vital_signs: { type: 'JSON' },
  implants_used: { type: 'TEXT' },
  position: { type: 'STRING', size: 100 },
  drains_tubes: { type: 'TEXT' },
  closure_method: { type: 'STRING', size: 100 },
  dressing_applied: { type: 'STRING', size: 100 }
};

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('ot_intra_operatives');
    for (const [name, def] of Object.entries(COLS)) {
      if (table[name]) continue;
      const type = def.size ? Sequelize[def.type](def.size) : Sequelize[def.type];
      await queryInterface.addColumn('ot_intra_operatives', name, { type, allowNull: true });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('ot_intra_operatives');
    for (const name of Object.keys(COLS)) {
      if (table[name]) await queryInterface.removeColumn('ot_intra_operatives', name);
    }
  }
};
