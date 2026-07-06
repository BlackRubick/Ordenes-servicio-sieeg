import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { generateQuotePdfDoc } from '../utils/quotesPdf';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Swal from 'sweetalert2';

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  const { role, user } = useAuthStore();
  const normalizedRole = String(role || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'administrador';
  const canSeeCosts = isAdmin || normalizedRole === 'mostrador';

  useEffect(() => {
    let active = true;

    const loadQuote = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/quotes/${id}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error || 'No se pudo cargar la cotización');
        }
        if (active) {
          setQuote(data);
          setError('');
        }
      } catch (loadError) {
        if (active) {
          setQuote(null);
          setError(loadError.message || 'No se pudo cargar la cotización');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadQuote();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-lg text-gray-500">Cargando cotización...</div>
      </DashboardLayout>
    );
  }

  if (error || !quote) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-lg text-red-500">{error || 'Cotización no encontrada'}</div>
      </DashboardLayout>
    );
  }

  const partidas = Array.isArray(quote.partidas) ? quote.partidas : [];

  const handleDeleteQuote = async () => {
    try {
      const result = await Swal.fire({
        title: '¿Eliminar cotización?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
      });

      if (!result.isConfirmed) return;

      const response = await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo eliminar la cotización');
      }

      await Swal.fire('Eliminada', 'La cotización fue eliminada correctamente.', 'success');
      navigate('/admin/quotes');
    } catch (err) {
      await Swal.fire('Error', err.message || 'No se pudo eliminar la cotización', 'error');
    }
  };

  const handleDownloadClientPDF = async () => {
    try {
      const doc = await generateQuotePdfDoc(quote, 'client');
      doc.save(`Cotizacion_Cliente_${quote.numeroCotizacion}.pdf`);
    } catch (e) {
      Swal.fire('Error', 'No se pudo generar el PDF', 'error');
    }
  };

  const handleDownloadInternalPDF = async () => {
    try {
      const doc = await generateQuotePdfDoc(quote, 'internal');
      doc.save(`Cotizacion_Interno_${quote.numeroCotizacion}.pdf`);
    } catch (e) {
      Swal.fire('Error', 'No se pudo generar el PDF interno', 'error');
    }
  };

  const handleCrearOrden = async () => {
    const confirm = await Swal.fire({
      title: '¿Crear orden de servicio?',
      text: `Se generará una orden con estatus "Pendiente" a partir de la cotización ${quote.numeroCotizacion}.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear orden',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    setCreatingOrder(true);
    try {
      const now = new Date();
      const yymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
      const folio = `OT-Q${quote.id}-${yymm}-${rand}`;
      const fecha = now.toISOString().slice(0, 10);

      const trabajos = partidas.map(p => ({
        descripcion: p.descripcion || '',
        costo: Number(p.importe) || 0,
      }));
      const totalTrabajos = trabajos.reduce((s, t) => s + t.costo, 0);

      const body = {
        folio,
        fecha,
        clientName: quote.cliente || '',
        telefono: quote.telefono || '',
        correo: quote.correo || '',
        tipo: null,
        description: quote.descripcionGeneral || partidas.map(p => p.descripcion).filter(Boolean).join(', ') || 'Generada desde cotización',
        status: 'pendiente',
        presupuestoCliente: quote.total || null,
        estadoPresupuesto: quote.total ? 'pendiente_aprobacion' : 'sin_presupuesto',
        trabajos,
        resumen: { total: totalTrabajos },
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo crear la orden');

      await Swal.fire('Orden creada', `Se creó la orden con folio: ${folio}`, 'success');
      navigate(`/admin/orders/${folio}`);
    } catch (err) {
      Swal.fire('Error', err.message || 'No se pudo crear la orden', 'error');
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 className="text-2xl font-extrabold text-primary-500">Cotización {quote.numeroCotizacion}</h2>
        <div className="flex flex-wrap gap-2">
          {isAdmin && (
            <button
              className="px-4 py-2 rounded-xl border border-blue-100 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-all"
              onClick={() => navigate(`/admin/quotes/${id}/edit`)}
            >
              Editar
            </button>
          )}
          {isAdmin && (
            <button
              className="px-4 py-2 rounded-xl border border-red-100 bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-all"
              onClick={handleDeleteQuote}
            >
              Eliminar
            </button>
          )}
          {/* PDF para el cliente (sin costos) */}
          <button
            className="px-4 py-2 rounded-xl bg-green-50 text-green-700 font-bold border border-green-100 hover:bg-green-100 transition-all"
            onClick={handleDownloadClientPDF}
            title="PDF para el cliente — sin precios de costo"
          >
            PDF Cliente
          </button>
          {/* PDF interno (con costos) — solo admin/mostrador */}
          {canSeeCosts && (
            <button
              className="px-4 py-2 rounded-xl bg-orange-50 text-orange-700 font-bold border border-orange-200 hover:bg-orange-100 transition-all"
              onClick={handleDownloadInternalPDF}
              title="PDF interno — incluye precios de costo"
            >
              PDF Interno
            </button>
          )}
          {/* Crear orden desde cotización — solo admin/mostrador */}
          {(isAdmin || normalizedRole === 'mostrador') && (
            <button
              className="px-4 py-2 rounded-xl bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-60"
              onClick={handleCrearOrden}
              disabled={creatingOrder}
              title="Genera una orden de servicio a partir de esta cotización"
            >
              {creatingOrder ? 'Creando...' : 'Crear Orden'}
            </button>
          )}
          <button
            className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
            onClick={() => navigate('/admin/quotes')}
          >
            Volver
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6 max-w-4xl mx-auto animate-fade-in border border-gray-100">
        {/* Datos generales */}
        <div className="mb-4 flex flex-wrap gap-6">
          <div>
            <div className="text-xs text-gray-400 font-semibold">Fecha</div>
            <div className="font-bold text-lg text-primary-600">{quote.fecha}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Empresa</div>
            <div className="font-semibold text-gray-700">{quote.empresa}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Cliente</div>
            <div className="font-semibold text-gray-700">{quote.cliente}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Vigencia</div>
            <div className="font-semibold text-gray-700">{quote.vigencia ? `${quote.vigencia} días` : 'Sin definir'}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Estado</div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">{quote.status || 'Borrador'}</span>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold">Vendedor</div>
            <div className="font-semibold text-gray-700">
              {quote.vendedorNombre
                ? `${quote.vendedorNombre}${quote.vendedorId ? ` (#${quote.vendedorId})` : ''}`
                : '— Sin asignar —'}
            </div>
          </div>
        </div>

        {/* Observaciones */}
        <div className="mb-6">
          <div className="text-xs text-gray-400 font-semibold mb-1">Observaciones</div>
          <div className="text-gray-700 italic whitespace-pre-wrap">{quote.observaciones || 'Sin observaciones'}</div>
        </div>

        {/* Partidas */}
        <div className="mb-6">
          <div className="text-xs text-gray-400 font-semibold mb-2">Partidas</div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-gradient-to-tr from-primary-500 to-secondary-500 text-white font-bold">
                  <th className="py-2 px-3 rounded-tl-2xl">#</th>
                  <th className="py-2 px-3">Descripción</th>
                  <th className="py-2 px-3">Cantidad</th>
                  <th className="py-2 px-3">Unidad</th>
                  {canSeeCosts && <th className="py-2 px-3 bg-orange-400">Costo</th>}
                  <th className="py-2 px-3">P. Unitario</th>
                  <th className="py-2 px-3">Importe</th>
                </tr>
              </thead>
              <tbody>
                {partidas.length === 0 && (
                  <tr>
                    <td colSpan={canSeeCosts ? 7 : 6} className="py-4 px-3 text-center text-gray-400">Sin partidas registradas</td>
                  </tr>
                )}
                {partidas.map((p, idx) => {
                  const costo = p.precioCosto !== '' && p.precioCosto !== undefined && p.precioCosto !== null ? Number(p.precioCosto) : null;
                  const pu = Number(p.precioUnitario || 0);
                  const margen = costo !== null && costo > 0 && pu > 0
                    ? `${(((pu - costo) / pu) * 100).toFixed(1)}%`
                    : null;
                  return (
                    <tr key={idx} className="bg-white border-b border-border last:border-0">
                      <td className="py-2 px-3 font-mono text-primary-600 font-bold">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div>{p.descripcion}</div>
                        {p.observaciones && <div className="text-xs text-gray-400 mt-0.5">{p.observaciones}</div>}
                      </td>
                      <td className="py-2 px-3">{p.cantidad}</td>
                      <td className="py-2 px-3">{p.unidad}</td>
                      {canSeeCosts && (
                        <td className="py-2 px-3 text-orange-700 font-mono text-xs">
                          {costo !== null
                            ? <>
                                ${costo.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                {margen && <span className="ml-1 text-green-600">({margen})</span>}
                              </>
                            : '—'}
                        </td>
                      )}
                      <td className="py-2 px-3">${pu.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 px-3">${Number(p.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end items-center gap-4 mt-6">
          <span className="text-lg font-bold text-gray-700">Total:</span>
          <span className="text-2xl font-extrabold text-primary-600">${Number(quote.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Datos emisor / cliente */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-xs text-gray-400 font-semibold mb-1">Datos del emisor</div>
            <div className="text-gray-700 text-sm">
              <div><b>Razón social:</b> {quote.razonSocial || 'Sin definir'}</div>
              <div><b>RFC:</b> {quote.rfc || 'Sin definir'}</div>
              <div><b>REPSE:</b> {quote.repse || 'Sin definir'}</div>
              <div><b>Dirección:</b> {quote.direccion || 'Sin definir'}</div>
              <div><b>Teléfono:</b> {quote.telefono || 'Sin definir'}</div>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400 font-semibold mb-1">Datos del cliente</div>
            <div className="text-gray-700 text-sm">
              <div><b>Empresa:</b> {quote.empresa || 'Sin definir'}</div>
              <div><b>Contacto:</b> {quote.cliente || 'Sin definir'}</div>
              <div><b>Correo:</b> {quote.correo || 'Sin definir'}</div>
              <div><b>Dirección:</b> {quote.direccionCliente || 'Sin definir'}</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
