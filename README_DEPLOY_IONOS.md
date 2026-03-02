# Deploy completo en IONOS (Frontend + Backend en el mismo servidor)

Guía práctica para dejar la plataforma funcionando en producción, con:
- Frontend React (build estático con Nginx)
- Backend Node/Express (PM2)
- MySQL
- SSL con Let's Encrypt
- Reinicio automático al reiniciar el servidor

---

## ⚡ DATOS DE DESPLIEGUE

| Parámetro | Valor |
|-----------|-------|
| **IP del servidor** | `74.208.164.167` |
| **Dominio Frontend** | `ordenes.sieeg.com.mx` |
| **Directorio destino** | `/var/www/ordenes-servicio-sieeg` |
| **Backend Port** | `3001` |
| **Base de datos** | `newordenes_db` |

> **IMPORTANTE:** Asegúrate de que el DNS apunte `ordenes.sieeg.com.mx` a `74.208.164.167`

---

## 0) Contexto esperado

Tu repo en servidor actualmente está así:

- `/root/Ordenes-servicio-sieeg`

Contenido:
- `api/`
- `src/`
- `public/`
- `package.json`

> **Nota importante:** Nginx no debe servir archivos desde `/root` por permisos.
> Vamos a mover el proyecto a `/var/www`.

---

## 1) Preparar servidor (Ubuntu)

```bash
apt update && apt upgrade -y
apt install -y nginx mysql-server curl git ufw
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
```

Verificar:

```bash
node -v
npm -v
pm2 -v
nginx -v
mysql --version
```

---

## 2) Mover proyecto a ruta de producción

```bash
mkdir -p /var/www
mv /root/Ordenes-servicio-sieeg /var/www/ordenes-servicio-sieeg
chown -R root:root /var/www/ordenes-servicio-sieeg
cd /var/www/ordenes-servicio-sieeg
```

---

## 3) Configurar MySQL

Entrar a MySQL:

```bash
mysql -u root -p
```

Ejecutar:

```sql
CREATE DATABASE IF NOT EXISTS newordenes_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'cesar'@'localhost' IDENTIFIED BY 'cesar123';
GRANT ALL PRIVILEGES ON newordenes_db.* TO 'cesar'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 4) Configurar variables de entorno del backend

Crear archivo:

```bash
cat > /var/www/ordenes-servicio-sieeg/api/.env << 'EOF'
PORT=3001
DB_HOST=localhost
DB_NAME=newordenes_db
DB_USER=cesar
DB_PASS=cesar123
EOF
```

---

## 5) Instalar dependencias (front + back)

```bash
cd /var/www/ordenes-servicio-sieeg
npm ci
cd api
npm ci
cd ..
```

---

## 6) Ajuste obligatorio de URLs de API en Frontend

Tu frontend actualmente usa `http://localhost:3001/...` en varios fetch.
En producción eso falla en navegador remoto.

### Opción rápida (recomendada para ya desplegar)

Reemplazar todas las llamadas para usar ruta relativa `/api/...`:

```bash
cd /var/www/ordenes-servicio-sieeg
grep -R "http://localhost:3001" -n src || true
find src -type f \( -name "*.js" -o -name "*.jsx" \) -print0 | xargs -0 sed -i 's|http://localhost:3001||g'
```

Verificar que no queden referencias:

```bash
grep -R "http://localhost:3001" -n src || true
```

---

## 7) Build del frontend

```bash
cd /var/www/ordenes-servicio-sieeg
npm run build
```

Esto genera `/var/www/ordenes-servicio-sieeg/build`.

---

## 8) Levantar backend con PM2

Primero, si hay procesos viejos, elimínalos:

```bash
pm2 delete all
```

Luego inicia el backend:

```bash
cd /var/www/ordenes-servicio-sieeg
pm2 start api/index.js --name neworders-api
pm2 save
pm2 startup
```

El comando `pm2 startup` te dará otra línea para ejecutar (cópiala y ejecútala).

Validar que esté corriendo:

```bash
pm2 status
```

Debe mostrar **solo un proceso** llamado `neworders-api` con estado `online`.

Probar que responda:

```bash
curl http://127.0.0.1:3001/
```

Debe responder: `API NEWORDERS funcionando`

---

## 9) Configurar Nginx (front + proxy API)

Crear config:

```bash
cat > /etc/nginx/sites-available/ordenes-servicio-sieeg << 'EOF'
server {
    listen 80;
    server_name ordenes.sieeg.com.mx www.ordenes.sieeg.com.mx;

    root /var/www/ordenes-servicio-sieeg/build;
    index index.html;

    # Frontend React
    location / {
        try_files $uri /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

Activar sitio:

```bash
ln -s /etc/nginx/sites-available/ordenes-servicio-sieeg /etc/nginx/sites-enabled/ordenes-servicio-sieeg
nginx -t
systemctl reload nginx
```

---

## 10) SSL (HTTPS) con Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d ordenes.sieeg.com.mx -d www.ordenes.sieeg.com.mx
```

Verificar renovación automática:

```bash
systemctl status certbot.timer
```

---

## 11) Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status
```

---

## 12) Pruebas finales

### Backend

```bash
curl https://ordenes.sieeg.com.mx/api/orders
curl https://ordenes.sieeg.com.mx/api/users
```

### Frontend

Abrir en navegador:

- `https://ordenes.sieeg.com.mx/login_magic`
- `https://ordenes.sieeg.com.mx/consulta-publica`
- Flujos de admin/técnico completos

### PM2/Nginx

```bash
pm2 logs neworders-api --lines 100
systemctl status nginx
```

---

## 13) Comandos de operación diaria

### Reiniciar backend

```bash
pm2 restart neworders-api
```

### Ver logs backend

```bash
pm2 logs neworders-api
```

### Rebuild y redeploy frontend (cuando hagas cambios)

```bash
cd /var/www/ordenes-servicio-sieeg
git pull
npm ci
cd api && npm ci && cd ..
npm run build
pm2 restart neworders-api
systemctl reload nginx
```

---

## 14) Checklist anti-errores (muy importante)

- [ ] Proyecto fuera de `/root` (usar `/var/www/...`)
- [ ] `api/.env` correcto
- [ ] Base de datos y usuario MySQL creados
- [ ] No existen URLs `http://localhost:3001` en `src/`
- [ ] `npm run build` genera carpeta `build/`
- [ ] PM2 corriendo `api/index.js`
- [ ] Nginx con `try_files $uri /index.html;`
- [ ] Proxy `/api/` apuntando a `127.0.0.1:3001`
- [ ] SSL activo

---

## 15) Si algo falla

1. **Frontend en blanco / 404 al recargar ruta**
   - Falta `try_files $uri /index.html;` en Nginx.

2. **Error de API en navegador**
   - Aún hay `localhost:3001` hardcodeado en frontend.
   - Verifica con: `grep -R "localhost:3001" -n src`

3. **API no levanta**
   - Revisar logs: `pm2 logs neworders-api`
   - Revisar `.env` de `api/`
   - Probar DB credentials manualmente.

4. **Nginx no levanta**
   - `nginx -t`
   - Corrige config y recarga.

---

Con este procedimiento queda desplegado **frontend + backend** en el mismo servidor IONOS, estable, con HTTPS y listo para producción.