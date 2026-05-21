'use strict';

// The IPD Daily Care screen records multidisciplinary progress notes
// (Physiotherapist, Dietitian) and reuses this table for clinical "Orders".
// The original enum only allowed Doctor/Nurse, so those writes failed with
// "Data truncated for column 'note_type'". Widen the enum to match the UI.

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE ipd_progress_notes MODIFY note_type ENUM('Doctor','Nurse','Physiotherapist','Dietitian','Order') NOT NULL"
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query(
      "ALTER TABLE ipd_progress_notes MODIFY note_type ENUM('Doctor','Nurse') NOT NULL"
    );
  }
};
