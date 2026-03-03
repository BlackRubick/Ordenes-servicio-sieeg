# Sistema de Usuarios Clientes - Guía de Implementación

## 📋 Resumen de Cambios

Se ha implementado un sistema completo de gestión de usuarios clientes con las siguientes características:

### 🔐 Sistema de Login Independiente
- **Login en `/solicitar-orden-cliente`**: Los clientes deben iniciar sesión antes de crear órdenes
- **Separado de `/login_magic`**: Sistema de autenticación exclusivo para clientes
- **Sesión persistente**: Usa localStorage para mantener la sesión del cliente

### 👥 Gestión de Clientes (Admin)
- **Nueva página**: `/admin/clientes` solo accesible para administradores
- **CRUD completo**: Crear, listar, editar y eliminar usuarios clientes
- **Campos**: Nombre, Correo, Teléfono, Usuario, Contraseña

### 📝 Formulario Simplificado
- **Auto-completado**: Nombre, correo y teléfono se toman del perfil del cliente
- **Solo 3 campos**: Tipo de Equipo, Dirección, Descripción del Problema
- **Vinculación**: Orden queda asociada al clienteId

---

## 🗄️ Cambios en Base de Datos

### Nueva tabla: `Clients`
```sql
CREATE TABLE Clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(255) NOT NULL,
  usuario VARCHAR(255) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);
```

### Actualización tabla `Orders`
```sql
ALTER TABLE Orders ADD COLUMN clienteId INT NULL;
ALTER TABLE Orders ADD CONSTRAINT fk_cliente 
  FOREIGN KEY (clienteId) REFERENCES Clients(id) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;
```

---

## 🚀 Instrucciones de Despliegue

### Paso 1: Conectar al Servidor
```bash
ssh root@74.208.164.167
cd /var/www/ordenes-servicio-sieeg
```

### Paso 2: Actualizar Código
```bash
git pull origin main
```

### Paso 3: Instalar Dependencias (si es necesario)
```bash
cd newordenes-front/api
npm install
cd ../..
```

### Paso 4: Ejecutar Migración de Base de Datos

**Opción A: Usando Sequelize CLI**
```bash
cd newordenes-front/api
npx sequelize-cli db:migrate
cd ../..
```

**Opción B: SQL Manual**
```bash
mysql -u cesar -pcesar123 newordenes_db

# Ejecutar:
CREATE TABLE Clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  correo VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(255) NOT NULL,
  usuario VARCHAR(255) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE Orders ADD COLUMN clienteId INT NULL;

ALTER TABLE Orders ADD CONSTRAINT fk_cliente 
  FOREIGN KEY (clienteId) REFERENCES Clients(id) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;
```

### Paso 5: Build del Frontend
```bash
cd newordenes-front
npm run build
cd ..
```

### Paso 6: Reiniciar Servicios
```bash
pm2 restart neworders-api
pm2 restart neworders-app
pm2 status
```

### Paso 7: Verificar
- Visita: `http://74.208.164.167/admin/clientes` (debe mostrar página de gestión)
- Visita: `http://74.208.164.167/solicitar-orden-cliente` (debe mostrar login)

---

## 📁 Archivos Creados/Modificados

### Backend
- ✅ **Nuevo**: `api/models/Client.js` - Modelo de clientes
- ✅ **Nuevo**: `api/routes/clients.js` - Endpoints de clientes
- ✅ **Nuevo**: `api/migrations/20260303-create-clients.js` - Migración
- ✅ **Modificado**: `api/models/index.js` - Exportar Client y relaciones
- ✅ **Modificado**: `api/models/Order.js` - Agregar campo clienteId
- ✅ **Modificado**: `api/index.js` - Registrar ruta /api/clients

### Frontend
- ✅ **Nuevo**: `src/pages/ClientesManagement.jsx` - Gestión de clientes (admin)
- ✅ **Modificado**: `src/pages/SolicitarOrdenCliente.jsx` - Login + formulario
- ✅ **Modificado**: `src/components/Sidebar.jsx` - Agregar opción "Clientes"
- ✅ **Modificado**: `src/routes/AppRoutes.jsx` - Ruta /admin/clientes

---

## 🔐 Endpoints API Nuevos

### POST `/api/clients/login`
Login de clientes
```json
Request:
{
  "usuario": "juanp",
  "contrasena": "password123"
}

Response (éxito):
{
  "success": true,
  "client": {
    "id": 1,
    "nombre": "Juan Pérez",
    "correo": "juan@ejemplo.com",
    "telefono": "1234567890",
    "usuario": "juanp",
    "activo": true
  }
}
```

### POST `/api/clients`
Crear cliente (solo admin)
```json
{
  "nombre": "Juan Pérez",
  "correo": "juan@ejemplo.com",
  "telefono": "1234567890",
  "usuario": "juanp",
  "contrasena": "password123"
}
```

### GET `/api/clients`
Listar todos los clientes (solo admin)

### PUT `/api/clients/:id`
Actualizar cliente (solo admin)

### DELETE `/api/clients/:id`
Eliminar cliente (solo admin)

### GET `/api/clients/:id`
Obtener datos de un cliente

---

## 🎯 Flujo de Uso

### 1. Admin crea usuario cliente
1. Admin inicia sesión en `/login_magic`
2. Va a `/admin/clientes`
3. Click en "Nuevo Cliente"
4. Rellena: Nombre, Correo, Teléfono, Usuario, Contraseña
5. Guarda el cliente

### 2. Cliente recibe credenciales
Admin envía al cliente:
- Usuario: `juanp`
- Contraseña: `password123`

### 3. Cliente crea orden
1. Cliente va a `/solicitar-orden-cliente`
2. Ve formulario de login
3. Ingresa usuario y contraseña
4. Sistema valida y muestra formulario simplificado
5. Cliente rellena: Tipo de Equipo, Dirección, Descripción
6. Envía la orden (automáticamente incluye sus datos)

### 4. Orden queda registrada
- La orden tiene `clienteId` asociado
- Nombre, correo, teléfono vienen del perfil del cliente
- Aparece en el sistema con status "Pendiente"

---

## 🧪 Pruebas

### Crear cliente de prueba
```bash
curl -X POST http://74.208.164.167:3001/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Cliente Prueba",
    "correo": "prueba@test.com",
    "telefono": "5551234567",
    "usuario": "prueba",
    "contrasena": "test123"
  }'
```

### Probar login
```bash
curl -X POST http://74.208.164.167:3001/api/clients/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "prueba",
    "contrasena": "test123"
  }'
```

---

## ⚠️ Importante

- **Contraseñas hasheadas**: Todas las contraseñas se guardan con bcrypt
- **Sesión local**: La sesión del cliente se guarda en localStorage del navegador
- **Login separado**: `/login_magic` es para admin/técnicos, `/solicitar-orden-cliente` es solo para clientes
- **Validación de usuario**: Solo usuarios activos (`activo = true`) pueden iniciar sesión

---

## 🎨 Estilos

- Color principal: `#1a3a5e` (navy)
- Botones hover: `#2d5075`
- Diseño consistente con el resto de la aplicación

---

## 📞 Soporte

Si hay problemas durante el despliegue:
1. Verificar logs de PM2: `pm2 logs neworders-api`
2. Verificar logs de PM2: `pm2 logs neworders-app`
3. Verificar que la migración se ejecutó: `mysql -u cesar -p newordenes_db -e "SHOW TABLES;"`
4. Verificar que existe tabla Clients: `mysql -u cesar -p newordenes_db -e "DESCRIBE Clients;"`
