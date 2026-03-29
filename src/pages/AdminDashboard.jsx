import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setOrders(data);
        } else {
          console.error('Data is not an array:', data);
          setOrders([]);
        }
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setOrders([]);
      });
  }, []);

  // Estadísticas
  const estados = ['pendiente', 'revision', 'reparacion', 'lista', 'entregada', 'cancelada'];
  const stats = estados.reduce((acc, estado) => {
    acc[estado] = orders.filter(o => o.status === estado).length;
    return acc;
  }, {});
  const ingresos = orders.filter(o => o.status === 'entregada').reduce((sum, o) => sum + (o.total || 0), 0);

  // Últimas órdenes
  const ultimas = orders.slice(-5).reverse();

  // Datos para la gráfica de estados
  const chartData = {
    labels: estados.map(e => e.charAt(0).toUpperCase() + e.slice(1)),
    datasets: [
      {
        label: 'Órdenes',
        data: estados.map(e => stats[e]),
        backgroundColor: [
          '#fbbf24', // pendiente
          '#60a5fa', // revision
          '#f87171', // reparacion
          '#34d399', // lista
          '#6366f1', // entregada
          '#f87171', // cancelada
        ],
        borderRadius: 8,
      },
    ],
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Órdenes por Estado' },
    },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
    },
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 shadow-lg p-6 flex flex-col gap-2 animate-fade-up transform transition-transform duration-300 hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 p-2 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 10c-4.41 0-8-1.79-8-4V6c0-2.21 3.59-4 8-4s8 1.79 8 4v8c0 2.21-3.59 4-8 4z" /></svg>
            </span>
            <span className="text-white/80 text-xs">Ingresos de hoy</span>
          </div>
          <span className="text-2xl font-bold text-white drop-shadow">${ingresos.toFixed(2)}</span>
        </div>
        <div className="rounded-2xl bg-white shadow-card p-6 flex flex-col gap-2 animate-fade-up border-l-4 border-state-pending transform transition-transform duration-300 hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="bg-state-pending/10 p-2 rounded-xl">
              <svg className="w-6 h-6 text-state-pending" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
            </span>
            <span className="text-text-secondary text-xs">Pendientes</span>
          </div>
          <span className="text-2xl font-bold text-state-pending">{stats.pendiente}</span>
        </div>
        <div className="rounded-2xl bg-white shadow-card p-6 flex flex-col gap-2 animate-fade-up border-l-4 border-state-review transform transition-transform duration-300 hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="bg-state-review/10 p-2 rounded-xl">
              <svg className="w-6 h-6 text-state-review" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
            </span>
            <span className="text-text-secondary text-xs">En revisión</span>
          </div>
          <span className="text-2xl font-bold text-state-review">{stats.revision}</span>
        </div>
        <div className="rounded-2xl bg-white shadow-card p-6 flex flex-col gap-2 animate-fade-up border-l-4 border-state-repair transform transition-transform duration-300 hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="bg-state-repair/10 p-2 rounded-xl">
              <svg className="w-6 h-6 text-state-repair" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-3-3.87" /><path d="M4 21v-2a4 4 0 013-3.87" /><circle cx="12" cy="7" r="4" /></svg>
            </span>
            <span className="text-text-secondary text-xs">En reparación</span>
          </div>
          <span className="text-2xl font-bold text-state-repair">{stats.reparacion}</span>
        </div>
        <div className="rounded-2xl bg-white shadow-card p-6 flex flex-col gap-2 animate-fade-up border-l-4 border-green-500 transform transition-transform duration-300 hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="bg-green-500/10 p-2 rounded-xl">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
            </span>
            <span className="text-text-secondary text-xs">Listas</span>
          </div>
          <span className="text-2xl font-bold text-green-500">{stats.lista}</span>
        </div>
        <div className="rounded-2xl bg-white shadow-card p-6 flex flex-col gap-2 animate-fade-up border-l-4 border-blue-400 transform transition-transform duration-300 hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="bg-blue-400/10 p-2 rounded-xl">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="10" /></svg>
            </span>
            <span className="text-text-secondary text-xs">Entregadas</span>
          </div>
          <span className="text-2xl font-bold text-blue-400">{stats.entregada}</span>
        </div>
        <div className="rounded-2xl bg-white shadow-card p-6 flex flex-col gap-2 animate-fade-up border-l-4 border-state-cancelled transform transition-transform duration-300 hover:-translate-y-2 cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="bg-state-cancelled/10 p-2 rounded-xl">
              <svg className="w-6 h-6 text-state-cancelled" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </span>
            <span className="text-text-secondary text-xs">Canceladas</span>
          </div>
          <span className="text-2xl font-bold text-state-cancelled">{stats.cancelada}</span>
        </div>
        <div className="rounded-2xl bg-gradient-to-tr from-primary-500 to-secondary-500 shadow-lg p-6 flex flex-col gap-2 animate-fade-up transform transition-transform duration-300 hover:-translate-y-2 cursor-pointer col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 p-2 rounded-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2" /><path d="M16 11V7a4 4 0 00-8 0v4" /></svg>
            </span>
            <span className="text-white/80 text-xs">Total general</span>
          </div>
          <span className="text-2xl font-bold text-white drop-shadow">${ingresos.toFixed(2)}</span>
        </div>
      </div>
      {/* Gráfica y tabla de órdenes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 rounded-2xl bg-white shadow-card p-6 min-h-[300px] flex flex-col animate-fade-in border border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-text-secondary font-semibold">Estadísticas</span>
            <div className="flex gap-2 animate-fade-in">
              <select className="px-4 py-2 rounded-2xl border border-muted bg-white/80 focus:ring-2 focus:ring-primary/60 transition-all">
                <option>Este mes</option>
                <option>Este año</option>
              </select>
              <select className="px-4 py-2 rounded-2xl border border-muted bg-white/80 focus:ring-2 focus:ring-primary/60 transition-all">
                <option>Todos los técnicos</option>
              </select>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full h-64">
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-white shadow-card p-6 min-h-[300px] animate-fade-in border border-border flex flex-col">
          <span className="text-text-secondary font-semibold mb-2">Últimas órdenes</span>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary">
                <th className="py-2 px-3">Folio</th>
                <th className="py-2 px-3">Cliente</th>
                <th className="py-2 px-3">Estado</th>
                <th className="py-2 px-3">Total</th>
                <th className="py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ultimas.map((o, idx) => {
                // Mostrar el total correcto
                const total = o.total ?? o.presupuestoAdmin ?? o.presupuestoCliente ?? 0;
                return (
                  <tr key={o.id || idx} className="hover:bg-background transition-colors">
                    <td className="py-2 px-3 font-mono">{o.folio || o.id}</td>
                    <td className="py-2 px-3">{o.clientName || o.cliente}</td>
                    <td className="py-2 px-3"><span className="px-3 py-1 rounded-xl bg-state-review/30 text-state-review text-xs font-semibold">{o.status}</span></td>
                    <td className="py-2 px-3">${Number(total).toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <button
                        className="px-3 py-1 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-semibold shadow-soft hover:from-primary-600 hover:to-blue-400 transition-all"
                        onClick={() => navigate(`/ordenes/${o.folio || o.id}`)}
                      >Ver</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;

