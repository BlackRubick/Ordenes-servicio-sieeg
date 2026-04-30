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
  const cfg = ESTADO_CFG[key] || { soft: '#f1f5f9', txt: '#475569', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px',
      fontSize: '11px', fontWeight: 700, letterSpacing: '0.3px',
      background: cfg.soft, color: cfg.txt,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.accent, display: 'inline-block', flexShrink: 0 }} />
      {cfg.label || status}
    </span>
  );
};

// ─── Componente: tarjeta de métrica ─────────────────────────────────────────
const StatCard = ({ estado, count }) => {
  const cfg = ESTADO_CFG[estado];
  const Icon = ICONS[estado];
  return (
    <div style={{
      background: '#fff',
      borderRadius: '16px',
      padding: '20px 18px',
      border: '1px solid #f0f0f0',
      borderLeft: `4px solid ${cfg.accent}`,
      display: 'flex', flexDirection: 'column', gap: '12px',
      boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.08)`; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.04)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
          {cfg.label}
        </span>
        <div style={{ width: 34, height: 34, borderRadius: '10px', background: cfg.soft, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon color={cfg.accent} size={16} />
        </div>
      </div>
      <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
        {count}
      </div>
    </div>
  );
};

// ─── Componente: tarjeta hero (ingresos) ────────────────────────────────────
const HeroCard = ({ label, value, icon: Icon, sub }) => (
  <div style={{
    background: 'linear-gradient(135deg, #0052cc 0%, #0078ff 60%, #38bdf8 100%)',
    borderRadius: '16px',
    padding: '22px 20px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    boxShadow: '0 4px 24px rgba(0,120,255,0.25)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    position: 'relative',
    overflow: 'hidden',
  }}
  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,120,255,0.35)'; }}
  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,120,255,0.25)'; }}
  >
    {/* Círculo decorativo fondo */}
    <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
    <div style={{ position: 'absolute', right: 20, bottom: -30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
      <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
        {label}
      </span>
      <div style={{ width: 34, height: 34, borderRadius: '10px', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon color="#fff" size={16} />
      </div>
    </div>
    <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff', lineHeight: 1, position: 'relative' }}>
      ${Number(value).toFixed(2)}
    </div>
    {sub && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', position: 'relative' }}>{sub}</div>}
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
      <div style={{ background: '#f8fafc', minHeight: '100vh', padding: '0' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '28px', paddingBottom: '20px',
          borderBottom: '1px solid #f0f0f0',
        }}>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              Panel de control
            </h1>
            <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0', fontWeight: 400 }}>
              Ingeniería SIEEG — Órdenes de servicio
            </p>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: '#0078ff', color: '#fff',
            padding: '8px 16px', borderRadius: '10px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
          onClick={() => navigate('/admin/orders/new')}
          >
            <svg width="16" height="16" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" d="M12 5v14M5 12h14"/></svg>
            Nueva orden
          </div>
        </div>

        {/* ── Tarjetas hero ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
          <HeroCard label="Ingresos totales (entregadas)" value={ingresos} icon={IconTrend} sub="Suma de órdenes entregadas" />
          <HeroCard label="Total general (todas)" value={totalGeneral} icon={IconMoney} sub="Incluye todas las órdenes con valor" />
        </div>

        {/* ── Tarjetas de estados ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px',
          marginBottom: '24px',
        }}>
          {ESTADOS.map(estado => (
            <StatCard key={estado} estado={estado} count={stats[estado]} />
          ))}
        </div>

        {/* ── Gráfica + Tabla ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px' }}>

          {/* Gráfica */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Órdenes por estado</h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0' }}>Distribución actual</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select style={{
                  padding: '6px 12px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '12px',
                  color: '#475569', background: '#f8fafc', outline: 'none', cursor: 'pointer',
                }}>
                  <option>Este mes</option>
                  <option>Este año</option>
                </select>
                <select style={{
                  padding: '6px 12px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '12px',
                  color: '#475569', background: '#f8fafc', outline: 'none', cursor: 'pointer',
                }}>
                  <option>Todos los técnicos</option>
                </select>
              </div>
            </div>
            <div style={{ height: '260px' }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* Tabla últimas órdenes */}
          <div style={panelStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Últimas órdenes</h2>
                <p style={{ fontSize: '12px', color: '#94a3b8', margin: '3px 0 0' }}>Las 5 más recientes</p>
              </div>
              <button
                onClick={() => navigate('/admin/orders')}
                style={{
                  fontSize: '12px', color: '#0078ff', background: 'transparent',
                  border: '1px solid #bfdbfe', borderRadius: '8px',
                  padding: '5px 12px', cursor: 'pointer', fontWeight: 600,
                }}
              >
                Ver todas
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {ultimas.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: '13px' }}>
                  Sin órdenes recientes
                </div>
              )}
              {ultimas.map((o, idx) => {
                const total = getTotalOrden(o);
                return (
                  <div
                    key={o.id || idx}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 12px', borderRadius: '10px',
                      transition: 'background 0.15s', cursor: 'pointer',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/ordenes/${o.folio || o.id}`)}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                          #{o.folio || o.id}
                        </span>
                        <PillEstado status={o.status} />
                      </div>
                      <span style={{ fontSize: '12px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.clientName || o.cliente || '—'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        ${total.toFixed(2)}
                      </span>
                      <div style={{
                        width: 28, height: 28, borderRadius: '8px',
                        background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="14" height="14" fill="none" stroke="#0078ff" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 18l6-6-6-6"/></svg>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;