require('dotenv').config();
const sequelize = require('./db');
const models = require('./models');

(async () => {
  try {
    await sequelize.sync({ alter: false });

    const queryInterface = sequelize.getQueryInterface();
    const quoteTable = await queryInterface.describeTable('Quotes');
    if (!quoteTable.observacionesExtra) {
      await queryInterface.addColumn('Quotes', 'observacionesExtra', {
        type: require('sequelize').DataTypes.TEXT,
        allowNull: true,
      });
      console.log('✅ Columna observacionesExtra agregada a Quotes');
    }

    console.log('✅ Base de datos sincronizada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sincronizando BD:', error);
    process.exit(1);
  }
})();
