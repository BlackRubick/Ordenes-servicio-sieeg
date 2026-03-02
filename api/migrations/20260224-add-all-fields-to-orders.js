module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Orders', 'folio', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.addColumn('Orders', 'fecha', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: ''
    });
    await queryInterface.addColumn('Orders', 'telefono', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'correo', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'tipo', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'marca', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'modelo', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'serie', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'accesorios', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'otrosAccesorios', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'seguridad', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'patron', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'observaciones', {
      type: Sequelize.STRING,
      allowNull: true
    });
    await queryInterface.addColumn('Orders', 'firma', {
      type: Sequelize.TEXT,
      allowNull: true
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Orders', 'folio');
    await queryInterface.removeColumn('Orders', 'fecha');
    await queryInterface.removeColumn('Orders', 'telefono');
    await queryInterface.removeColumn('Orders', 'correo');
    await queryInterface.removeColumn('Orders', 'tipo');
    await queryInterface.removeColumn('Orders', 'marca');
    await queryInterface.removeColumn('Orders', 'modelo');
    await queryInterface.removeColumn('Orders', 'serie');
    await queryInterface.removeColumn('Orders', 'accesorios');
    await queryInterface.removeColumn('Orders', 'otrosAccesorios');
    await queryInterface.removeColumn('Orders', 'seguridad');
    await queryInterface.removeColumn('Orders', 'patron');
    await queryInterface.removeColumn('Orders', 'observaciones');
    await queryInterface.removeColumn('Orders', 'firma');
  }
};