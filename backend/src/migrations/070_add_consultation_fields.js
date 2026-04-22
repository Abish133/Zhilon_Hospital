'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('opd_consultations');
    if (!table.examination_findings) {
      await queryInterface.addColumn('opd_consultations', 'examination_findings', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'clinical_notes'
      });
    }
    if (!table.diagnosis_description) {
      await queryInterface.addColumn('opd_consultations', 'diagnosis_description', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'diagnosis_code'
      });
    }
    if (!table.follow_up_instructions) {
      await queryInterface.addColumn('opd_consultations', 'follow_up_instructions', {
        type: Sequelize.TEXT,
        allowNull: true,
        after: 'follow_up_date'
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('opd_consultations');
    if (table.examination_findings) await queryInterface.removeColumn('opd_consultations', 'examination_findings');
    if (table.diagnosis_description) await queryInterface.removeColumn('opd_consultations', 'diagnosis_description');
    if (table.follow_up_instructions) await queryInterface.removeColumn('opd_consultations', 'follow_up_instructions');
  }
};
