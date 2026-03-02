const { User } = require('./models');
const sequelize = require('./db');

const bcrypt = require('bcrypt');

async function createAdmin() {
  await sequelize.sync();
  const hashedPassword = await bcrypt.hash('Cuco2024**', 10);
  const admin = await User.create({
    nombre: 'Black Rubick',
    correo: 'blackrubick14@gmail.com',
    contrasena: hashedPassword,
    rol: 'admin',
    estado: 'activo'
  });
  console.log('Usuario admin creado:', admin.correo);
}

createAdmin().catch(console.error);
