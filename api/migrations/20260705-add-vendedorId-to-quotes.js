module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Quotes', 'vendedorId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Quotes', 'vendedorId');
  },
};
