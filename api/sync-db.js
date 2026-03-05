require('dotenv').config();
const sequelize = require('./db');
const models = require('./models');

(async () => {
  try {
    await sequelize.sync({ alter: false });
    console.log('✅ Base de datos sincronizada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error sincronizando BD:', error);
    process.exit(1);
  }
})();
