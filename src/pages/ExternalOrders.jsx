import React, { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';



export default function ExternalOrders() {
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    fetch('/api/orders?external=true')
      .then(res => res.json())
      .then(data => setOrders(data))
      .catch(() => setOrders([]));
  }, []);

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Órdenes de Servicio Externas</h2>
        <button
          className="bg-primary text-white px-4 py-2 rounded-xl font-semibold shadow-md hover:bg-primary-dark transition"
          onClick={() => navigate('/servicios-externos')}
        >
          Crear orden externa
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-card p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">ID</th>
              <th className="py-2 px-4 text-left">Cliente</th>
              <th className="py-2 px-4 text-left">Dirección</th>
              <th className="py-2 px-4 text-left">Fecha</th>
              <th className="py-2 px-4 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} className="border-b last:border-none">
                <td className="py-2 px-4">{order.id}</td>
                <td className="py-2 px-4">{order.cliente}</td>
                <td className="py-2 px-4">{order.direccion}</td>
                <td className="py-2 px-4">{order.fecha}</td>
                <td className="py-2 px-4">{order.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
