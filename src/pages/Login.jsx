import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const loginStore = useAuthStore();

  const validate = () => {
    const errors = {};
    if (!email) errors.email = 'El correo es obligatorio';
    if (!password) errors.password = 'La contraseña es obligatoria';
    return errors;
  };

  const handleBlur = (e) => {
    setTouched({ ...touched, [e.target.name]: true });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setTouched({ email: true, password: true });
      setError('Completa todos los campos');
      return;
    }
    fetch('/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo: email, contrasena: password })
    })
      .then(res => res.json())
      .then(data => {
        console.log('Respuesta login:', data);
        if (data.success) {
          setError('');
          loginStore.login(data.user, data.user.rol);
          console.log('Usuario logueado:', data.user);
          const rol = String(data.user.rol || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase();
          if (rol === 'admin' || rol === 'administrador') {
            navigate('/admin/dashboard');
          } else if (rol === 'technician' || rol === 'tecnico') {
            navigate('/admin/orders');
          } else if (rol === 'mostrador') {
            navigate('/admin/orders');
          }
        } else {
          setError('Credenciales incorrectas');
        }
      })
      .catch(() => {
        setError('Error de conexión');
      });
  };

  const errors = validate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1628 0%, #0d2a4a 50%, #0a1628 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'sans-serif',
    }}>

      {/* Líneas de circuito decorativas */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06, pointerEvents: 'none' }}
        viewBox="0 0 800 600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        stroke="#0078ff"
        strokeWidth="1"
      >
        <line x1="0" y1="100" x2="200" y2="100" />
        <circle cx="200" cy="100" r="4" fill="#0078ff" />
        <line x1="200" y1="100" x2="200" y2="300" />
        <line x1="200" y1="300" x2="400" y2="300" />
        <line x1="600" y1="50" x2="800" y2="50" />
        <circle cx="600" cy="50" r="4" fill="#0078ff" />
        <line x1="600" y1="50" x2="600" y2="200" />
        <line x1="600" y1="200" x2="750" y2="200" />
        <line x1="0" y1="450" x2="150" y2="450" />
        <circle cx="150" cy="450" r="4" fill="#0078ff" />
        <line x1="150" y1="450" x2="150" y2="550" />
        <line x1="700" y1="350" x2="800" y2="350" />
        <circle cx="700" cy="350" r="4" fill="#0078ff" />
        <line x1="700" y1="350" x2="700" y2="500" />
        <line x1="700" y1="500" x2="800" y2="500" />
      </svg>

      {/* Card principal */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(0,120,255,0.25)',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        boxShadow: '0 0 40px rgba(0,120,255,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}>

        {/* Logo directo sin caja detrás */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '1.75rem' }}>
          <img
            src="/images/logo.ico"
            alt="Ingeniería SIEEG"
            style={{
              width: '100%',
              maxWidth: '300px',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <div style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#3b9eff',
            letterSpacing: '2px',
            textAlign: 'center',
            textTransform: 'uppercase',
          }}>
            Órdenes de Servicio
          </div>
        </div>

        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(0,120,255,0.4), transparent)',
          marginBottom: '1.75rem',
        }} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>

          {/* Alerta general */}
          {error && (
            <div style={{
              background: 'rgba(255,80,80,0.1)',
              border: '1px solid rgba(255,80,80,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#ff8080',
              textAlign: 'center',
              marginBottom: '1.25rem',
            }}>
              {error}
            </div>
          )}

          {/* Campo correo */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Correo electrónico
            </label>
            <div style={{ position: 'relative' }}>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#ffffff" strokeWidth="2" strokeLinecap="round"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }}
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m2 7 10 7 10-7" />
              </svg>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onBlur={handleBlur}
                autoComplete="username"
                style={{
                  width: '100%',
                  background: touched.email && errors.email ? 'rgba(255,80,80,0.05)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${touched.email && errors.email ? 'rgba(255,80,80,0.6)' : 'rgba(0,120,255,0.2)'}`,
                  borderRadius: '10px',
                  padding: '12px 14px 12px 42px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {touched.email && errors.email && (
              <span style={{ fontSize: '11px', color: '#ff6b6b', marginTop: '5px', display: 'block' }}>
                {errors.email}
              </span>
            )}
          </div>

          {/* Campo contraseña */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="password" style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(255,255,255,0.5)',
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#ffffff" strokeWidth="2" strokeLinecap="round"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onBlur={handleBlur}
                autoComplete="current-password"
                style={{
                  width: '100%',
                  background: touched.password && errors.password ? 'rgba(255,80,80,0.05)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${touched.password && errors.password ? 'rgba(255,80,80,0.6)' : 'rgba(0,120,255,0.2)'}`,
                  borderRadius: '10px',
                  padding: '12px 14px 12px 42px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {touched.password && errors.password && (
              <span style={{ fontSize: '11px', color: '#ff6b6b', marginTop: '5px', display: 'block' }}>
                {errors.password}
              </span>
            )}
          </div>

          {/* Botón */}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #0078ff 0%, #0055cc 100%)',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.5px',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,120,255,0.35)',
            }}
          >
            Entrar
          </button>

        </form>
      </div>
    </div>
  );
};

export default Login;