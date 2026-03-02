
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());


const sequelize = require('./db');
const models = require('./models');

app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/technicians', require('./routes/technicians'));

app.get('/', (req, res) => {
  res.send('API NEWORDERS funcionando');
});

sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor API escuchando en puerto ${PORT}`);
  });
});
