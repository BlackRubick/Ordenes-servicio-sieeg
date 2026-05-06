
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const sequelize = require('./db');
const models = require('./models');

app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/technicians', require('./routes/technicians'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/products', require('./routes/products'));

app.get('/', (req, res) => {
  res.send('API NEWORDERS funcionando');
});

// Avoid automatic schema alteration in production environments — it can
// produce problematic ALTER statements (see ER_TOO_MANY_KEYS). Use
// migrations instead. For now, start without `alter` to prevent the error.
sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor API escuchando en puerto ${PORT}`);
  });
});
