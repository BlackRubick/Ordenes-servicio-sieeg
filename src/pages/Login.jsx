
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';

// ...existing code...
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
          const rol = data.user.rol?.toLowerCase();
          if (rol === 'admin' || rol === 'administrador') {
            console.log('Navegando a /admin');
            navigate('/admin');
          } else if (rol === 'technician' || rol === 'técnico') {
            console.log('Navegando a /technician');
            navigate('/technician');
          }
        } else {
          setError('Credenciales incorrectas');
          console.log('Login fallido');
        }
      })
      .catch((err) => {
        setError('Error de conexión');
        console.log('Error fetch login:', err);
      });
  };

  const errors = validate();

  return (
    <AuthLayout>
      <form className="flex flex-col gap-7 animate-fade-in" onSubmit={handleSubmit}>
        <h2 className="text-3xl font-bold text-center text-primary-500 mb-2 tracking-tight">Iniciar Sesión</h2>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-medium text-dark">Correo electrónico</label>
          <input
            id="email"
            name="email"
            type="email"
            className={`px-4 py-3 rounded-2xl border transition-all bg-white/80 outline-none focus:ring-2 focus:ring-primary/60 ${touched.email && errors.email ? 'border-error' : 'border-muted'}`}
            placeholder="usuario@correo.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onBlur={handleBlur}
            autoComplete="username"
          />
          {touched.email && errors.email && <span className="text-error text-xs mt-1 animate-fade-in">{errors.email}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="text-sm font-medium text-dark">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            className={`px-4 py-3 rounded-2xl border transition-all bg-white/80 outline-none focus:ring-2 focus:ring-primary/60 ${touched.password && errors.password ? 'border-error' : 'border-muted'}`}
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onBlur={handleBlur}
            autoComplete="current-password"
          />
          {touched.password && errors.password && <span className="text-error text-xs mt-1 animate-fade-in">{errors.password}</span>}
        </div>
        <div className="flex items-center gap-2">
          <input id="remember" type="checkbox" className="rounded accent-primary" />
          <label htmlFor="remember" className="text-sm text-dark">Recordar sesión</label>
        </div>
        {error && <div className="text-error text-sm text-center animate-fade-in">{error}</div>}
        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-semibold shadow-soft transition-all duration-300 hover:scale-[1.04] active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-300"
        >
          Entrar
        </button>
      </form>
    </AuthLayout>
  );
};

export default Login;
