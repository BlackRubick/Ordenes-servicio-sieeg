module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'usuarioCreador', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'usuarioCreador');
  }
};
