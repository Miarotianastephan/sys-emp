'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `ALTER TABLE emp_presence_checkin
         ADD COLUMN dateCheckin DATE GENERATED ALWAYS AS (DATE(debutCheckin)) VIRTUAL,
         ADD UNIQUE INDEX uq_user_date (idUser, dateCheckin);`,
        { transaction }
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.removeIndex('emp_presence_checkin', 'uq_user_date', { transaction });
      await queryInterface.removeColumn('emp_presence_checkin', 'dateCheckin', { transaction });
    });
  },
};
