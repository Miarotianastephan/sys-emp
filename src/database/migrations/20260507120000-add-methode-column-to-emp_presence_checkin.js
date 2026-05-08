'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('emp_presence_checkin', 'methode', {
      type: Sequelize.ENUM('manuel', 'wifi', 'qr', 'gps', 'empreinte', 'facial'),
      allowNull: false,
      defaultValue: 'manuel',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('emp_presence_checkin', 'methode');
  },
};
