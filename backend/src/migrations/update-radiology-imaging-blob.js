'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('radiology_imaging', 'images_path', {
      type: Sequelize.BLOB('long'),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('radiology_imaging', 'images_path', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  }
};
