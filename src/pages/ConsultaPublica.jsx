import React, { useState } from 'react';
import Swal from 'sweetalert2';

const normalizeStatus = (status) => {
  const statusMap = {
    'pendiente': 'Pendiente',
    'revision': 'En revisión',
    'en revisión': 'En revisión',
    'reparacion': 'En reparación',
    'en reparación': 'En reparación',
    'lista': 'Listo',
    'listo': 'Listo',
    'entregada': 'Entregado',
    'entregado': 'Entregado',
    'cancelada': 'Cancelada',
  };
  const normalized = String(status || '').toLowerCase().trim();
  return statusMap[normalized] || status || 'Pendiente';
};

export default function ConsultaPublica() {
  const [folio, setFolio] = useState('');
  const [order, setOrder] = useState(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!folio.trim()) {
      Swal.fire('Campo obligatorio', 'Por favor ingresa un número de folio.', 'warning');
      return;
    }
    
    fetch(`/api/orders`)
      .then(res => res.json())
      .then(data => {
        const allOrders = Array.isArray(data) ? data : [];
        const foundOrder = allOrders.find(o => 
          String(o.folio || '').toLowerCase() === folio.trim().toLowerCase()
        );
        
        if (!foundOrder) {
          setOrder(null);
          Swal.fire('No encontrado', 'No existe una orden con ese folio.', 'error');
        } else {
          // Mapear datos de la orden
          const mappedOrder = {
            folio: foundOrder.folio,
            fecha: foundOrder.fecha || '-',
            estado: normalizeStatus(foundOrder.status || foundOrder.estado),
            tecnico: foundOrder.tecnico || 'Sin asignar',
            equipo: foundOrder.tipo && foundOrder.marca && foundOrder.modelo 
              ? `${foundOrder.tipo} ${foundOrder.marca} ${foundOrder.modelo}`.trim()
              : foundOrder.tipo || 'Equipo',
            detalles: foundOrder.description || foundOrder.descripcion || 'No especificado',
            tipo: foundOrder.tipo || 'normal',
            clientName: foundOrder.clientName || foundOrder.nombre || 'Cliente',
            historial: ['Pendiente'], // Simplificado por ahora
          };
          setOrder(mappedOrder);
        }
      })
      .catch(() => {
        setOrder(null);
        Swal.fire('Error', 'No se pudo conectar con la API.', 'error');
      });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f6fbff] to-[#eaf3fa] px-2 py-8">
      <div className="flex flex-col items-center mb-8">
        <div className="bg-white rounded-full shadow-lg p-4 mb-4 flex items-center justify-center">
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold text-blue-500 mb-2 text-center">Consulta tu Orden</h1>
        <p className="text-lg text-gray-500 text-center">Ingresa tu número de folio para ver el estado de tu equipo</p>
      </div>
      {!order && (
        <form onSubmit={handleSearch} className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-4 border-t-4 border-blue-400">
          <label className="font-bold text-gray-700 mb-1">NÚMERO DE FOLIO</label>
          <input
            className="w-full px-5 py-3 rounded-xl border border-gray-200 bg-gray-50 shadow-inner text-lg font-mono placeholder-gray-400 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            placeholder="EJ: S2501104"
            value={folio}
            onChange={e => setFolio(e.target.value)}
          />
          <div className="flex items-center text-xs text-gray-400 gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><circle cx="12" cy="8" r="1" /></svg>
            El folio te fue proporcionado al ingresar tu equipo
          </div>
          <button type="submit" className="mt-2 px-6 py-3 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all flex items-center gap-2 self-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" /><circle cx="11" cy="11" r="8" /></svg>
            Buscar
          </button>
        </form>
      )}
      {order && (
        <div className="w-full max-w-2xl mt-8 animate-fade-in">
          <div className="rounded-t-2xl bg-blue-500 px-6 pt-6 pb-3 flex items-center justify-between shadow-md">
            <div>
              <div className="text-xs text-white/80 font-semibold">Folio de Orden</div>
              <div className="text-2xl md:text-3xl font-extrabold text-white tracking-widest font-mono">{order.folio}</div>
            </div>
            <div className="bg-blue-400 rounded-full p-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20h9" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.5a2.121 2.121 0 013 3L7 19.5 3 21l1.5-4L16.5 3.5z" /></svg>
            </div>
          </div>
          {/* Progreso */}
          <div className="bg-white px-6 pt-6 pb-2 rounded-b-2xl shadow-md">
            <div className="text-center font-semibold text-gray-700 mb-4">Progreso de tu Servicio</div>
            <div className="flex justify-between items-center mb-6">
              {['Pendiente', 'En revisión', 'En reparación', 'Listo', 'Entregado'].map((step, idx) => {
                const steps = ['Pendiente', 'En revisión', 'En reparación', 'Listo', 'Entregado'];
                const currentIndex = steps.indexOf(order.estado);
                const stepIndex = idx;
                const reached = stepIndex <= currentIndex;
                const isActive = order.estado === step;
                return (
                  <div key={step} className="flex-1 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 border-2 ${isActive ? 'bg-blue-500 border-blue-600 text-white' : reached ? 'bg-blue-100 border-blue-300 text-blue-400' : 'bg-gray-100 border-gray-300 text-gray-400'}` }>
                      {reached ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${isActive ? 'text-blue-600' : reached ? 'text-blue-400' : 'text-gray-400'}`}>{step}</span>
                  </div>
                );
              })}
            </div>
            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-4 shadow-sm">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">FECHA DE INGRESO</div>
                  <div className="font-bold text-gray-700">{order.fecha}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-purple-50 rounded-xl p-4 shadow-sm">
                <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" /><path d="M5.5 21h13a2 2 0 002-2v-2a7 7 0 00-14 0v2a2 2 0 002 2z" /></svg>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">TÉCNICO SIEEG</div>
                  <div className="font-bold text-gray-700">{order.tecnico}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-4 shadow-sm">
                <svg className="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M16 3v4M8 3v4" /></svg>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">QUIEN</div>
                  <div className="font-bold text-gray-700">{order.equipo}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-green-50 rounded-xl p-4 shadow-sm">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="14" r="3" /></svg>
                <div>
                  <div className="text-xs text-gray-500 font-semibold">ESTADO ACTUAL</div>
                  <div className="font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full inline-block text-sm">{order.estado}</div>
                </div>
              </div>
            </div>

            {/* Problema reportado */}
            <div className="flex items-center gap-3 bg-red-50 rounded-xl p-4 shadow-sm mb-4">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><circle cx="12" cy="16" r="1" /></svg>
              <div>
                <div className="text-xs text-gray-500 font-semibold">SERVICIO</div>
                <div className="font-bold text-gray-700">{order.detalles}</div>
              </div>
            </div>
          </div>
          {/* Información importante */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><circle cx="12" cy="8" r="1" /></svg>
              <span className="font-bold text-blue-700">Información Importante</span>
            </div>
            <ul className="text-blue-900 text-sm list-disc pl-6 space-y-1">
              <li>Te notificaremos cuando tu equipo esté listo para recoger</li>
              <li>Si tienes dudas, contacta al técnico asignado</li>
              <li>Conserva tu número de folio para futuras consultas</li>
            </ul>
          </div>
          {/* Botón para buscar otra orden */}
          <div className="flex justify-center mt-8">
            <button
              className="w-full max-w-xs px-6 py-3 rounded-xl bg-blue-500 text-white font-bold shadow-lg hover:bg-blue-600 transition-all"
              onClick={() => { setOrder(null); setFolio(''); }}
            >
              Buscar otra orden
            </button>
          </div>
        </div>
      )}
      <div className="w-full max-w-md mt-10 mx-auto bg-white rounded-2xl shadow-xl p-6 flex flex-col items-center gap-2 border-t-4 border-blue-400">
        <div className="text-center text-gray-700 font-semibold mb-2">¿Necesitas ayuda?</div>
        <div className="flex gap-2 items-center justify-center">
          <a href="tel:9613336529" className="flex items-center gap-1 text-blue-500 font-bold hover:underline">
            {/* Icono de teléfono auricular */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2A19.72 19.72 0 013 5.18 2 2 0 015 3h3a2 2 0 012 1.72c.13 1.05.37 2.07.72 3.06a2 2 0 01-.45 2.11l-1.27 1.27a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45c.99.35 2.01.59 3.06.72A2 2 0 0122 16.92z" />
            </svg>
            961 333 6529
          </a>
          <a href="https://wa.me/529613336529" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 bg-green-100 text-green-700 font-bold px-3 py-1 rounded-xl hover:bg-green-200 transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.52 3.48A12.07 12.07 0 0012 0C5.37 0 0 5.37 0 12a11.93 11.93 0 001.67 6.13L0 24l6.37-1.67A12.07 12.07 0 0012 24c6.63 0 12-5.37 12-12a11.93 11.93 0 00-3.48-8.52zM12 22a9.93 9.93 0 01-5.09-1.39l-.36-.21-3.78 1 1-3.67-.24-.38A9.93 9.93 0 012 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10zm5.2-7.8c-.28-.14-1.65-.81-1.9-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.2-.6.07-.28-.14-1.18-.44-2.25-1.41-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.18-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.34-.26.27-1 1-1 2.43s1.02 2.82 1.16 3.02c.14.2 2.01 3.08 4.88 4.2.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.65-.67 1.89-1.32.23-.65.23-1.2.16-1.32-.07-.12-.25-.19-.53-.33z" /></svg>WhatsApp</a>
        </div>
      </div>
    </div>
  );
}