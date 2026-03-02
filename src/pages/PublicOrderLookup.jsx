import React from 'react';
import AuthLayout from '../layouts/AuthLayout';

const PublicOrderLookup = () => (
  <AuthLayout>
    <form className="flex flex-col gap-6 animate-fade-in max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center text-primary mb-2">Consulta de Orden</h2>
      <input className="px-4 py-3 rounded-2xl border border-border focus:ring-2 focus:ring-primary-500 outline-none bg-white/80" placeholder="Ingresa tu folio" />
      <button type="submit" className="w-full py-3 rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-electric text-white font-semibold shadow-soft hover:from-primary-600 hover:to-violet-soft transition-all">Consultar</button>
    </form>
    <div className="mt-8 rounded-2xl bg-white/80 shadow-card p-6 animate-fade-in">
      <div className="mb-2 text-dark font-semibold">Estado actual: <span className="px-3 py-1 rounded-xl bg-state-review/30 text-info text-xs font-semibold">En revisión</span></div>
      <div className="mb-2 text-dark">Técnico asignado: <span className="font-medium">Técnico 1</span></div>
      <div className="mb-2 text-dark">Diagnóstico: <span className="font-medium">Pendiente</span></div>
      <div className="mb-2 text-dark">Costos: <span className="font-medium">$0.00</span></div>
      <div className="mb-2 text-dark">Fecha estimada: <span className="font-medium">25/02/2026</span></div>
    </div>
  </AuthLayout>
);

export default PublicOrderLookup;
