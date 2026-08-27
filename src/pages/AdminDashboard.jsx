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

// ─── Utilidad: total real de una orden (lógica original intacta) ─────────────
function getTotalOrden(o) {
  if (o.resumen && typeof o.resumen.total === 'number' && o.resumen.total > 0) return o.resumen.total;
  if (o.total && Number(o.total) > 0) return Number(o.total);
  if (o.presupuestoAdmin && Number(o.presupuestoAdmin) > 0) return Number(o.presupuestoAdmin);
  if (o.presupuestoCliente && Number(o.presupuestoCliente) > 0) return Number(o.presupuestoCliente);
  return 0;
}

// ─── Config de estados ───────────────────────────────────────────────────────
const ESTADOS = ['pendiente', 'revision', 'reparacion', 'lista', 'entregada', 'cancelada'];

const ESTADO_CFG = {
  pendiente:  { label: 'Pendientes',    accent: '#f59e0b', soft: '#fef3c7', txt: '#92400e', chartColor: '#fbbf24' },
  revision:   { label: 'En revisión',   accent: '#60a5fa', soft: '#dbeafe', txt: '#1e40af', chartColor: '#60a5fa' },
  reparacion: { label: 'En reparación', accent: '#f87171', soft: '#fee2e2', txt: '#991b1b', chartColor: '#f87171' },
  lista:      { label: 'Listas',        accent: '#34d399', soft: '#d1fae5', txt: '#065f46', chartColor: '#34d399' },
  entregada:  { label: 'Entregadas',    accent: '#818cf8', soft: '#e0e7ff', txt: '#3730a3', chartColor: '#6366f1' },
  cancelada:  { label: 'Canceladas',    accent: '#fb7185', soft: '#ffe4e6', txt: '#9f1239', chartColor: '#f87171' },
};

// ─── Íconos SVG inline ───────────────────────────────────────────────────────
const IconClock    = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>;
const IconSearch   = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>;
const IconWrench   = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>;
const IconCheck    = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M5 13l4 4L19 7"/></svg>;
const IconBox      = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/></svg>;
const IconX        = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><path d="M6 18L18 6M6 6l12 12"/></svg>;
const IconMoney    = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 3H8a2 2 0 00-2 2v2h12V5a2 2 0 00-2-2z"/></svg>;
const IconTrend    = ({ color, size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;

const ICONS = { pendiente: IconClock, revision: IconSearch, reparacion: IconWrench, lista: IconCheck, entregada: IconBox, cancelada: IconX };

// ─── Componente: pill de estado ──────────────────────────────────────────────
const PillEstado = ({ status }) => {
  const key = (status || '').toLowerCase();
  const cfg = ESTADO_CFG[key] || { soft: '#f1f5f9', txt: '#475569', accent: '#cbd5e1', label: status };
  return (
    <span
      style={{ background: cfg.soft, color: cfg.txt }}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
    >
      <span style={{ background: cfg.accent }} className="w-1.5 h-1.5 rounded-full flex-shrink-0" />
      {cfg.label || status}
    </span>
  );
};

// ─── Componente: tarjeta de métrica ─────────────────────────────────────────
const StatCard = ({ estado, count }) => {
  const cfg = ESTADO_CFG[estado];
  const Icon = ICONS[estado];
  return (
    <div
      style={{ borderLeft: `4px solid ${cfg.accent}` }}
      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{cfg.label}</span>
        <div style={{ background: cfg.soft }} className="w-9 h-9 rounded-xl flex items-center justify-center">
          <Icon color={cfg.accent} size={16} />
        </div>
      </div>
      <div className="text-3xl font-extrabold text-gray-900 leading-none">{count}</div>
    </div>
  );
};

// ─── Componente: tarjeta hero (ingresos) ────────────────────────────────────
const HeroCard = ({ label, value, icon: Icon, sub }) => (
  <div className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-primary-800 via-primary-600 to-primary-400 shadow-md hover:-translate-y-1 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col gap-2">
    <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10 pointer-events-none" />
    <div className="absolute right-5 -bottom-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
    <div className="relative flex items-center justify-between">
      <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">{label}</span>
      <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
        <Icon color="#fff" size={16} />
      </div>
    </div>
    <div className="relative text-3xl font-extrabold text-white leading-none">
      ${Number(value).toFixed(2)}
    </div>
    {sub && <div className="relative text-xs text-white/60">{sub}</div>}
  </div>
);

// ─── Dashboard principal ─────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOrders(data);
        else { console.error('Data is not an array:', data); setOrders([]); }
      })
      .catch(err => { console.error('Error fetching orders:', err); setOrders([]); });
  }, []);

  // ── Estadísticas (lógica original intacta) ───────────────────────────────
  const stats = ESTADOS.reduce((acc, estado) => {
    acc[estado] = orders.filter(o => (o.status || '').toLowerCase() === estado).length;
    return acc;
  }, {});

  const entregadasDebug = orders.filter(o => (o.status || '').toLowerCase() === 'entregada');
  console.log('Órdenes entregadas para ingresos:', entregadasDebug.map(o => ({ folio: o.folio, status: o.status, total: getTotalOrden(o) })));
  const ingresos = entregadasDebug.reduce((sum, o) => sum + getTotalOrden(o), 0);

  const ultimas = orders.slice(-5).reverse();

  // ── Datos gráfica (colores originales intactos) ──────────────────────────
  const chartData = {
    labels: ESTADOS.map(e => e.charAt(0).toUpperCase() + e.slice(1)),
    datasets: [{
      label: 'Órdenes',
      data: ESTADOS.map(e => stats[e]),
      backgroundColor: ESTADOS.map(e => ESTADO_CFG[e].chartColor),
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#94a3b8',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#94a3b8', font: { size: 11 } },
        grid: { color: '#f1f5f9' },
      },
    },
  };

  // ── Total general (todas las órdenes con valor) ──────────────────────────
  const totalGeneral = orders.reduce((sum, o) => sum + getTotalOrden(o), 0);

  // ── Estilos compartidos ──────────────────────────────────────────────────
  const panelStyle = {
    background: '#fff',
    borderRadius: '16px',
    border: '1px solid #f0f0f0',
    boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
    padding: '22px 20px',
  };

  return (
    <DashboardLayout>

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6 pb-5 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Panel de control</h1>
          <p className="text-sm text-gray-400 mt-0.5">Ingeniería SIEEG — Órdenes de servicio</p>
        </div>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold shadow-sm transition-all active:scale-95"
          onClick={() => navigate('/admin/orders/new')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva orden
        </button>
      </div>

      {/* ── Tarjetas hero ── */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <HeroCard label="Ingresos totales (entregadas)" value={ingresos} icon={IconTrend} sub="Suma de órdenes entregadas" />
        <HeroCard label="Total general (todas)" value={totalGeneral} icon={IconMoney} sub="Incluye todas las órdenes con valor" />
      </div>

      {/* ── Tarjetas de estados ── */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {ESTADOS.map(estado => (
          <StatCard key={estado} estado={estado} count={stats[estado]} />
        ))}
      </div>

      {/* ── Gráfica + Últimas órdenes ── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1.6fr 1fr' }}>

        {/* Gráfica */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Órdenes por estado</h2>
              <p className="text-xs text-gray-400 mt-0.5">Distribución actual</p>
            </div>
            <div className="flex gap-2">
              <select className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-500 bg-white outline-none focus:ring-2 focus:ring-primary-200 cursor-pointer">
                <option>Este mes</option>
                <option>Este año</option>
              </select>
              <select className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-500 bg-white outline-none focus:ring-2 focus:ring-primary-200 cursor-pointer">
                <option>Todos los técnicos</option>
              </select>
            </div>
          </div>
          <div className="h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Últimas órdenes */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-gray-900">Últimas órdenes</h2>
              <p className="text-xs text-gray-400 mt-0.5">Las 5 más recientes</p>
            </div>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-xs text-primary-600 font-semibold border border-primary-200 rounded-lg px-3 py-1.5 hover:bg-primary-50 transition-all"
            >
              Ver todas
            </button>
          </div>

          <div className="flex flex-col gap-0.5">
            {ultimas.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm">Sin órdenes recientes</span>
              </div>
            )}
            {ultimas.map((o, idx) => {
              const total = getTotalOrden(o);
              return (
                <div
                  key={o.id || idx}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/ordenes/${o.folio || o.id}`)}
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 font-mono">#{o.folio || o.id}</span>
                      <PillEstado status={o.status} />
                    </div>
                    <span className="text-xs text-gray-500 truncate">{o.clientName || o.cliente || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-sm font-bold text-gray-900">${total.toFixed(2)}</span>
                    <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-primary-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;