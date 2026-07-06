import React, { useEffect, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const fmt = (n) => Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_COLORS = {
  Aprobado:  { bg: '#d1fae5', text: '#065f46' },
  Pendiente: { bg: '#fef3c7', text: '#92400e' },
  Borrador:  { bg: '#f1f5f9', text: '#475569' },
  Cancelada: { bg: '#fee2e2', text: '#991b1b' },
};

export default function ReporteVendedores() {
  const [stats, setStats] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emisorFilter, setEmisorFilter] = useState('todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [selectedVendedor, setSelectedVendedor] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [statsRes, quotesRes] = await Promise.all([
          fetch('/api/quotes/stats/vendedores'),
          fetch('/api/quotes'),
        ]);
        const statsData = await statsRes.json();
        const quotesData = await quotesRes.json();
        if (statsRes.ok) setStats(Array.isArray(statsData) ? statsData : []);
        if (quotesRes.ok) setQuotes(Array.isArray(quotesData) ? quotesData : []);
      } catch (e) {
        setError('No se pudieron cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Filtrar cotizaciones por emisor y fechas para el detalle
  const filteredQuotes = quotes.filter(q => {
    if (emisorFilter !== 'todos') {
      const emisor = String(q?.emisor || '').toLowerCase().trim();
      if (emisorFilter !== emisor) return false;
    }
    if (fechaDesde && q.fecha < fechaDesde) return false;
    if (fechaHasta && q.fecha > fechaHasta) return false;
    if (selectedVendedor !== null) {
      if (selectedVendedor === 'sin_vendedor') return !q.vendedorId;
      return String(q.vendedorId) === String(selectedVendedor);
    }
    return true;
  });

  // Recalcular stats con los filtros aplicados
  const statsMap = {};
  filteredQuotes.forEach(q => {
    const key = q.vendedorId ? String(q.vendedorId) : 'sin_vendedor';
    const nombre = q.vendedorNombre || 'Sin vendedor asignado';
    if (!statsMap[key]) {
      statsMap[key] = { vendedorId: key, vendedorNombre: nombre, totalCotizaciones: 0, totalValor: 0, totalAprobado: 0, porEstado: {} };
    }
    statsMap[key].totalCotizaciones += 1;
    statsMap[key].totalValor += Number(q.total) || 0;
    if (q.status === 'Aprobado') statsMap[key].totalAprobado += Number(q.total) || 0;
    const s = q.status || 'Borrador';
    statsMap[key].porEstado[s] = (statsMap[key].porEstado[s] || 0) + 1;
  });
  const statsFiltered = Object.values(statsMap).sort((a, b) => b.totalValor - a.totalValor);

  const totalGeneral = statsFiltered.reduce((s, v) => s + v.totalValor, 0);
  const totalAprobadoGeneral = statsFiltered.reduce((s, v) => s + v.totalAprobado, 0);

  const chartData = {
    labels: statsFiltered.map(v => v.vendedorNombre),
    datasets: [
      {
        label: 'Total cotizado',
        data: statsFiltered.map(v => v.totalValor),
        backgroundColor: '#60a5fa',
        borderRadius: 6,
      },
      {
        label: 'Total aprobado',
        data: statsFiltered.map(v => v.totalAprobado),
        backgroundColor: '#34d399',
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: $${fmt(ctx.raw)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (v) => `$${Number(v).toLocaleString('es-MX')}`,
        },
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-extrabold text-primary-500">Reporte de ventas por vendedor</h2>
        <button
          className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
          onClick={() => navigate('/admin/quotes')}
        >
          Volver a cotizaciones
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Emisor</label>
          <select
            value={emisorFilter}
            onChange={e => setEmisorFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="todos">Todos</option>
            <option value="sieeg">SIEEG</option>
            <option value="sinar">Persona física (SINAR)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha desde</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={e => setFechaDesde(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha hasta</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Vendedor</label>
          <select
            value={selectedVendedor || ''}
            onChange={e => setSelectedVendedor(e.target.value || null)}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="">Todos</option>
            <option value="sin_vendedor">Sin vendedor</option>
            {statsFiltered.filter(v => v.vendedorId !== 'sin_vendedor').map(v => (
              <option key={v.vendedorId} value={v.vendedorId}>{v.vendedorNombre}</option>
            ))}
          </select>
        </div>
        {(emisorFilter !== 'todos' || fechaDesde || fechaHasta || selectedVendedor) && (
          <div className="flex items-end">
            <button
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all"
              onClick={() => { setEmisorFilter('todos'); setFechaDesde(''); setFechaHasta(''); setSelectedVendedor(null); }}
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {loading && <div className="text-center py-12 text-gray-400">Cargando datos...</div>}
      {error && <div className="text-center py-12 text-red-500">{error}</div>}

      {!loading && !error && (
        <>
          {/* Tarjetas resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="text-xs text-gray-400 font-semibold mb-1">Total cotizado</div>
              <div className="text-2xl font-extrabold text-primary-600">${fmt(totalGeneral)}</div>
              <div className="text-xs text-gray-400 mt-1">{filteredQuotes.length} cotizaciones</div>
            </div>
            <div className="bg-white rounded-2xl border border-green-200 p-5 shadow-sm">
              <div className="text-xs text-green-600 font-semibold mb-1">Total aprobado</div>
              <div className="text-2xl font-extrabold text-green-700">${fmt(totalAprobadoGeneral)}</div>
              <div className="text-xs text-gray-400 mt-1">
                {totalGeneral > 0 ? `${((totalAprobadoGeneral / totalGeneral) * 100).toFixed(1)}% del total` : '—'}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-purple-200 p-5 shadow-sm">
              <div className="text-xs text-purple-600 font-semibold mb-1">Vendedores activos</div>
              <div className="text-2xl font-extrabold text-purple-700">{statsFiltered.length}</div>
            </div>
          </div>

          {/* Gráfica */}
          {statsFiltered.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
              <h3 className="text-base font-bold text-gray-700 mb-4">Ventas por vendedor</h3>
              <Bar data={chartData} options={chartOptions} />
            </div>
          )}

          {/* Tabla de vendedores */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold">
                  <th className="py-3 px-4 rounded-tl-2xl text-left">Vendedor</th>
                  <th className="py-3 px-4 text-center">Cotizaciones</th>
                  <th className="py-3 px-4 text-right">Total cotizado</th>
                  <th className="py-3 px-4 text-right">Total aprobado</th>
                  <th className="py-3 px-4 text-center">% Aprobado</th>
                  <th className="py-3 px-4 rounded-tr-2xl text-center">Estados</th>
                </tr>
              </thead>
              <tbody>
                {statsFiltered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">No hay datos con los filtros seleccionados.</td>
                  </tr>
                )}
                {statsFiltered.map((v, idx) => {
                  const pct = v.totalValor > 0 ? ((v.totalAprobado / v.totalValor) * 100).toFixed(1) : '0.0';
                  return (
                    <tr
                      key={v.vendedorId}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => setSelectedVendedor(selectedVendedor === v.vendedorId ? null : v.vendedorId)}
                    >
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold">
                            {v.vendedorNombre.slice(0, 2).toUpperCase()}
                          </div>
                          {v.vendedorNombre}
                          {v.vendedorId !== 'sin_vendedor' && (
                            <span className="text-xs text-gray-400">#{v.vendedorId}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono">{v.totalCotizaciones}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">${fmt(v.totalValor)}</td>
                      <td className="py-3 px-4 text-right font-mono text-green-700 font-semibold">${fmt(v.totalAprobado)}</td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-400 rounded-full"
                              style={{ width: `${Math.min(parseFloat(pct), 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600">{pct}%</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {Object.entries(v.porEstado).map(([st, cnt]) => {
                            const cfg = STATUS_COLORS[st] || { bg: '#f1f5f9', text: '#475569' };
                            return (
                              <span
                                key={st}
                                style={{ background: cfg.bg, color: cfg.text }}
                                className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              >
                                {st}: {cnt}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Detalle de cotizaciones del vendedor seleccionado */}
          {selectedVendedor && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-700">
                  Cotizaciones de: {statsFiltered.find(v => v.vendedorId === selectedVendedor)?.vendedorNombre || 'Sin vendedor'}
                </h3>
              </div>
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="py-2 px-4 text-left font-semibold text-gray-600">Número</th>
                    <th className="py-2 px-4 text-left font-semibold text-gray-600">Fecha</th>
                    <th className="py-2 px-4 text-left font-semibold text-gray-600">Empresa</th>
                    <th className="py-2 px-4 text-left font-semibold text-gray-600">Emisor</th>
                    <th className="py-2 px-4 text-right font-semibold text-gray-600">Total</th>
                    <th className="py-2 px-4 text-center font-semibold text-gray-600">Estado</th>
                    <th className="py-2 px-4 text-center font-semibold text-gray-600">Ver</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotes.map(q => {
                    const cfg = STATUS_COLORS[q.status] || { bg: '#f1f5f9', text: '#475569' };
                    return (
                      <tr key={q.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-4 font-mono text-primary-600">{q.numeroCotizacion}</td>
                        <td className="py-2 px-4">{q.fecha}</td>
                        <td className="py-2 px-4">{q.empresa}</td>
                        <td className="py-2 px-4 capitalize">{q.emisor || '—'}</td>
                        <td className="py-2 px-4 text-right font-semibold">${fmt(q.total)}</td>
                        <td className="py-2 px-4 text-center">
                          <span style={{ background: cfg.bg, color: cfg.text }} className="px-2 py-0.5 rounded-full text-xs font-semibold">
                            {q.status || 'Borrador'}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-center">
                          <button
                            className="px-3 py-1 rounded-lg bg-primary-50 text-primary-700 text-xs font-semibold hover:bg-primary-100 transition-all"
                            onClick={e => { e.stopPropagation(); navigate(`/admin/quotes/${q.id}`); }}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
