import DashboardLayout from '../layouts/DashboardLayout';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';

const ESTADOS = ['Pendiente', 'En proceso', 'Completada'];

const getDataFromObservaciones = (observaciones) => {
  if (!observaciones) return { tipoEquipo: '-', direccion: '-' };
  if (typeof observaciones === 'object') return {
    tipoEquipo: observaciones.tipoEquipo || '-',
    direccion: observaciones.direccion || '-'
  };
  try {
    const parsed = JSON.parse(observaciones);
    return {
      tipoEquipo: parsed?.tipoEquipo || '-',
      direccion: parsed?.direccion || '-'
    };
  } catch (_) {
    return { tipoEquipo: '-', direccion: '-' };
  }
};

const parseImagenes = (imagenes) => {
  if (Array.isArray(imagenes)) return imagenes;
  if (typeof imagenes === 'string') {
    try {
      const parsed = JSON.parse(imagenes);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }
  return [];
};

const formatMoney = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? `$${number.toFixed(2)}` : '—';
};

const CLIENT_ORDERS_NAV_CONTEXT_KEY = 'client_orders_nav_context';

const getDashboardScrollContainer = () => document.getElementById('dashboard-scroll-container');

const getScrollSnapshot = () => {
  const scrollContainer = getDashboardScrollContainer();
  const docY = document.documentElement?.scrollTop || document.body?.scrollTop || 0;
  return {
    windowY: window.scrollY || window.pageYOffset || 0,
    docY,
    containerScrollTop: scrollContainer ? scrollContainer.scrollTop : 0,
  };
};


function OrdenesClientes() {
  const { role, user } = useAuthStore();
  const normalizedRole = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador';
  const isTechnician = normalizedRole === 'tecnico';
  const isMostrador = normalizedRole === 'mostrador';
  const currentUserName = user?.nombre || user?.name || '';
  const [ordenes, setOrdenes] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [searchCliente, setSearchCliente] = useState('');
  const [fechaExacta, setFechaExacta] = useState('');
  const [highlightedFolio, setHighlightedFolio] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const focusFolioFromQuery = React.useMemo(() => {
    const params = new URLSearchParams(location.search || '');
    return params.get('focus') || '';
  }, [location.search]);
  const hasRestoredScrollRef = React.useRef(false);

  useEffect(() => {
    // Cargar órdenes de tipo cliente
    fetch('/api/orders')
      .then(res => res.json())
      .then(data => {
        let clienteOrders = (Array.isArray(data) ? data : [])
          .filter(order => String(order.tipo || '').toLowerCase() === 'cliente')
          .map(order => {
            const obsData = getDataFromObservaciones(order.observaciones);
            return {
              ...order,
              presupuestoCliente: order.presupuestoCliente !== null && order.presupuestoCliente !== undefined && order.presupuestoCliente !== ''
                ? Number(order.presupuestoCliente)
                : null,
              presupuestoAdmin: order.presupuestoAdmin !== null && order.presupuestoAdmin !== undefined && order.presupuestoAdmin !== ''
                ? Number(order.presupuestoAdmin)
                : null,
              cliente: order.clientName || order.nombre || '-',
              direccion: obsData.direccion,
              tipoEquipo: obsData.tipoEquipo,
              tecnico: order.tecnico || '',
              estado: order.status || 'Pendiente',
              descripcion: order.description || order.descripcion || '',
              imagenes: parseImagenes(order.imagenes),
            };
          });
        // Si es técnico, solo mostrar sus órdenes asignadas
        if (normalizedRole === 'tecnico' && currentUserName) {
          clienteOrders = clienteOrders.filter(order => order.tecnico === currentUserName);
        }
        setOrdenes(clienteOrders);
      })
      .catch(() => {
        Swal.fire('Error', 'No se pudieron cargar las órdenes', 'error');
        setOrdenes([]);
      });

    // Cargar técnicos
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setTechnicians(data.filter(u => (u.rol || '').toLowerCase() === 'técnico'));
      })
      .catch(() => setTechnicians([]));
  }, [normalizedRole, currentUserName]);

  const handleTecnicoChange = async (idx, technicianName) => {
    const selected = technicians.find(t => (t.nombre || t.name) === technicianName);
    if (!selected) return;

    const orden = ordenes[idx];
    setOrdenes(prev => prev.map((o, i) => (i === idx ? { ...o, tecnico: technicianName } : o)));

    try {
      await fetch(`/api/orders/${orden.folio}/tecnico`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ technicianId: selected.id }),
      });
    } catch (_) {
      Swal.fire('Error', 'No se pudo actualizar el técnico', 'error');
    }
  };

  const handleEstadoChange = async (idx, newEstado) => {
    const orden = ordenes[idx];
    setOrdenes(prev => prev.map((o, i) => (i === idx ? { ...o, estado: newEstado } : o)));

    try {
      await fetch(`/api/orders/${orden.folio}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: newEstado }),
      });
    } catch (_) {
      Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    }
  };

  const handleVer = (orden) => {
    const snapshot = getScrollSnapshot();

    try {
      sessionStorage.setItem(CLIENT_ORDERS_NAV_CONTEXT_KEY, JSON.stringify({
        ...snapshot,
        folio: orden.folio,
        timestamp: Date.now(),
      }));
    } catch (_) {
      // ignore storage issues
    }

    navigate(`/ordenes-clientes/${orden.folio}`, {
      state: {
        orden,
        fromList: true,
        returnFolio: orden.folio,
      },
    });
  };

  const handleDelete = async (orden) => {
    const result = await Swal.fire({
      title: '¿Eliminar orden?',
      text: `Se eliminará la orden ${orden.folio} de forma permanente.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/orders/${orden.folio}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('No se pudo eliminar');
      setOrdenes(prev => prev.filter(o => o.folio !== orden.folio));
      Swal.fire('Eliminada', 'La orden fue eliminada correctamente.', 'success');
    } catch (_) {
      Swal.fire('Error', 'No se pudo eliminar la orden en el servidor', 'error');
    }
  };

  // Filtro de órdenes por nombre de cliente y fechas
  const ordenesFiltradas = ordenes.filter(o => {
    const clienteMatch = searchCliente.trim() === '' || (o.cliente || '').toLowerCase().includes(searchCliente.trim().toLowerCase());
    const fechaMatch = !fechaExacta || (o.fecha && o.fecha === fechaExacta);
    return clienteMatch && fechaMatch;
  });

  useEffect(() => {
    if (focusFolioFromQuery) {
      setHighlightedFolio(focusFolioFromQuery);
      return;
    }

    if (location.state?.restoreFolio) {
      setHighlightedFolio(location.state.restoreFolio);
      return;
    }

    let navContext = null;
    try {
      navContext = JSON.parse(sessionStorage.getItem(CLIENT_ORDERS_NAV_CONTEXT_KEY) || 'null');
    } catch (_) {
      navContext = null;
    }

    if (navContext?.folio) {
      setHighlightedFolio(navContext.folio);
    }
  }, [location.state, focusFolioFromQuery]);

  useEffect(() => {
    if (hasRestoredScrollRef.current || ordenes.length === 0) return;

    let navContext = null;
    try {
      navContext = JSON.parse(sessionStorage.getItem(CLIENT_ORDERS_NAV_CONTEXT_KEY) || 'null');
    } catch (_) {
      navContext = null;
    }

    if (!navContext) return;

    hasRestoredScrollRef.current = true;

    const restoreScroll = () => {
      const scrollContainer = getDashboardScrollContainer();
      if (scrollContainer && typeof navContext.containerScrollTop === 'number') {
        scrollContainer.scrollTop = navContext.containerScrollTop;
      }

      if (typeof navContext.windowY === 'number') {
        window.scrollTo({ top: navContext.windowY, behavior: 'auto' });
      }

      if (typeof navContext.docY === 'number') {
        document.documentElement.scrollTop = navContext.docY;
        document.body.scrollTop = navContext.docY;
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        restoreScroll();
      });
    });

    const retry1 = setTimeout(restoreScroll, 80);
    const retry2 = setTimeout(restoreScroll, 220);
    const retry3 = setTimeout(restoreScroll, 450);

    const clearContextTimer = setTimeout(() => {
      try {
        sessionStorage.removeItem(CLIENT_ORDERS_NAV_CONTEXT_KEY);
      } catch (_) {
        // ignore storage issues
      }
    }, 2200);

    return () => {
      clearTimeout(retry1);
      clearTimeout(retry2);
      clearTimeout(retry3);
      clearTimeout(clearContextTimer);
    };
  }, [ordenes]);

  useEffect(() => {
    if (!highlightedFolio) return;
    const timer = setTimeout(() => setHighlightedFolio(null), 4000);
    return () => clearTimeout(timer);
  }, [highlightedFolio]);

  useEffect(() => {
    if (!highlightedFolio || ordenesFiltradas.length === 0) return;

    const scrollToHighlightedRow = () => {
      const row = document.querySelector(`[data-folio="${highlightedFolio}"]`);
      if (!row) return;

      // First, force browser-native scroll to the row regardless of which container actually scrolls.
      row.scrollIntoView({ block: 'center', behavior: 'auto' });

      const scrollContainer = getDashboardScrollContainer();
      if (scrollContainer && scrollContainer.scrollHeight > scrollContainer.clientHeight + 1) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        const offset = rowRect.top - containerRect.top;
        const target = scrollContainer.scrollTop + offset - 120;
        scrollContainer.scrollTo({ top: Math.max(target, 0), behavior: 'auto' });
      } else {
        const rect = row.getBoundingClientRect();
        const absoluteTop = rect.top + (window.scrollY || window.pageYOffset || 0);
        window.scrollTo({ top: Math.max(absoluteTop - 140, 0), behavior: 'auto' });
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToHighlightedRow);
    });

    const retry1 = setTimeout(scrollToHighlightedRow, 120);
    const retry2 = setTimeout(scrollToHighlightedRow, 320);
    const retry3 = setTimeout(scrollToHighlightedRow, 650);
    const retry4 = setTimeout(scrollToHighlightedRow, 1100);
    const retry5 = setTimeout(scrollToHighlightedRow, 1700);

    return () => {
      clearTimeout(retry1);
      clearTimeout(retry2);
      clearTimeout(retry3);
      clearTimeout(retry4);
      clearTimeout(retry5);
    };
  }, [highlightedFolio, ordenesFiltradas]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-4">
        <h2 className="text-2xl font-extrabold text-primary-500 tracking-tight">Órdenes de Clientes</h2>
        {/* Filtros */}
        <div className="flex flex-wrap gap-4 items-end mb-2">
          <div>
            <label className="block text-sm font-bold text-primary-700 mb-1">Buscar por cliente</label>
            <input
              type="text"
              className="rounded-xl border border-blue-200 px-3 py-2 w-56 focus:ring-2 focus:ring-primary-200 outline-none"
              placeholder="Nombre del cliente..."
              value={searchCliente}
              onChange={e => setSearchCliente(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-primary-700 mb-1">Fecha</label>
            <input
              type="date"
              className="rounded-xl border border-blue-200 px-3 py-2 w-44 focus:ring-2 focus:ring-primary-200 outline-none"
              value={fechaExacta}
              onChange={e => setFechaExacta(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-2 rounded-2xl bg-gradient-to-tr from-primary-100 to-blue-50 shadow-lg p-1 overflow-x-auto animate-fade-in">
          <table className="min-w-full text-base border-separate border-spacing-0">
            <thead>
              <tr className="text-left text-white font-bold bg-gradient-to-tr from-primary-500 to-secondary-500 rounded-2xl">
                <th className="py-3 px-4 rounded-tl-2xl">Folio</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Dirección</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Presupuesto</th>
                <th className="py-3 px-4">Técnico</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 rounded-tr-2xl">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenesFiltradas.length === 0 && (
                <tr>
                    <td colSpan={8} className="text-center text-gray-500 py-8 bg-white rounded-b-2xl">
                    No hay órdenes de clientes registradas.
                  </td>
                </tr>
              )}
              {ordenesFiltradas.map((orden, idx) => (
                <tr data-folio={orden.folio || ''} key={orden.folio || orden.id} className={`bg-white border-b border-border last:border-0 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:bg-primary-50 ${highlightedFolio === orden.folio ? 'ring-2 ring-amber-300' : ''}`}>
                  <td className="py-4 px-4 font-bold text-dark">{orden.folio || '-'}</td>
                  <td className="py-4 px-4">{orden.cliente}</td>
                  <td className="py-4 px-4">{orden.direccion}</td>
                  <td className="py-4 px-4">{orden.fecha || '-'}</td>
                  <td className="py-4 px-4 min-w-[160px]">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-gray-700">
                        {orden.presupuestoCliente ? `Estimado del cliente: ${formatMoney(orden.presupuestoCliente)}` : 'Sin estimado del cliente'}
                      </span>
                      <span className="text-xs font-semibold text-gray-700">
                        {orden.presupuestoAdmin ? `Propuesta del admin: ${formatMoney(orden.presupuestoAdmin)}` : 'Sin propuesta del admin'}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {isTechnician || isMostrador ? (
                      <span className="font-semibold text-primary-600">{orden.tecnico || 'Sin asignar'}</span>
                    ) : (
                      <select
                        className="rounded-xl border border-border px-2 py-1 w-40 bg-primary-100 text-primary-700 font-bold"
                        value={orden.tecnico}
                        onChange={e => handleTecnicoChange(idx, e.target.value)}
                      >
                        <option value="">Sin asignar</option>
                        {technicians.map(t => {
                          const name = t.nombre || t.name;
                          return <option key={t.id} value={name}>{name}</option>;
                        })}
                      </select>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {isMostrador ? (
                      <span className={`font-semibold ${
                        orden.estado === 'Pendiente' ? 'text-yellow-700' : orden.estado === 'Completada' ? 'text-green-700' : 'text-blue-700'}`}>
                        {orden.estado}
                      </span>
                    ) : (
                      <select
                        className={`rounded-xl border border-border px-2 py-1 w-32 font-semibold 
                          ${orden.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-700' : orden.estado === 'Completada' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                        value={orden.estado}
                        onChange={e => handleEstadoChange(idx, e.target.value)}
                      >
                        {ESTADOS.map(e => (
                          <option key={e} value={e}>{e}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        className="px-4 py-2 rounded-xl bg-primary-500 text-white font-bold shadow-lg hover:bg-primary-600 transition-all"
                        onClick={() => handleVer(orden)}
                      >
                        Ver
                      </button>
                      {isAdmin && (
                        <button
                          className="px-4 py-2 rounded-xl bg-red-500 text-white font-bold shadow-lg hover:bg-red-600 transition-all"
                          onClick={() => handleDelete(orden)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OrdenesClientes;
