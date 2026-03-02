import React from 'react';
import AuthLayout from '../layouts/AuthLayout';

const PublicOrderCreate = () => (
  <AuthLayout>
    <form className="flex flex-col gap-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-center text-primary mb-2">Generar Orden Pública</h2>
      <input className="px-4 py-3 rounded-2xl border border-border focus:ring-2 focus:ring-primary-500 outline-none bg-white/80" placeholder="Nombre completo" />
      <input className="px-4 py-3 rounded-2xl border border-border focus:ring-2 focus:ring-primary-500 outline-none bg-white/80" placeholder="Correo electrónico" />
      <input className="px-4 py-3 rounded-2xl border border-border focus:ring-2 focus:ring-primary-500 outline-none bg-white/80" placeholder="Teléfono" />
      <input className="px-4 py-3 rounded-2xl border border-border focus:ring-2 focus:ring-primary-500 outline-none bg-white/80" placeholder="Equipo (tipo, marca, modelo)" />
      <textarea className="px-4 py-3 rounded-2xl border border-border focus:ring-2 focus:ring-primary-500 outline-none bg-white/80 min-h-[60px]" placeholder="Describe el problema..." />
      <button type="submit" className="w-full py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-electric text-white font-semibold shadow-soft hover:from-primary-600 hover:to-violet-soft transition-all">Generar Orden</button>
    </form>
  </AuthLayout>
);

export default PublicOrderCreate;
