import React from 'react';
import { useAuthStore } from '../store/authStore';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import AdminDashboard from '../pages/AdminDashboard';
import Orders from '../pages/Orders';
import OrderDetail from '../pages/OrderDetail';
import CreateOrder from '../pages/CreateOrder';
import TechnicianOrders from '../pages/TechnicianOrders';
import TechnicianOrderDetail from '../pages/TechnicianOrderDetail';
import PublicOrderCreate from '../pages/PublicOrderCreate';
import PublicOrderLookup from '../pages/PublicOrderLookup';
import ConsultaPublica from '../pages/ConsultaPublica';
import DeletedOrders from '../pages/DeletedOrders';
import Technicians from '../pages/Technicians';
import ForeignServices from '../pages/ForeignServices';
import ForeignServicesCreate from '../pages/ForeignServicesCreate';
import OrdenesClientes from '../pages/OrdenesClientes';
import SolicitarOrdenCliente from '../pages/SolicitarOrdenCliente';
import OrdenClienteDetalle from '../pages/OrdenClienteDetalle';


const PrivateRoute = ({ element, allowedRoles = [] }) => {
  const { user, role } = useAuthStore();
  const normalizedRole = String(role || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const normalizedAllowed = allowedRoles.map(r =>
    String(r || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  );
  
  if (!user) return <NotFound />;
  
  // Si hay roles permitidos y el usuario no tiene uno de ellos
  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(normalizedRole)) {
    return <NotFound />;
  }
  
  return element;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login_magic" element={<Login />} />
      <Route path="/consulta-publica" element={<ConsultaPublica />} />
      <Route path="/solicitar-orden-cliente" element={<SolicitarOrdenCliente />} />

      {/* Rutas privadas solo si hay usuario autenticado */}
      <Route path="/admin" element={<PrivateRoute element={<AdminDashboard />} allowedRoles={['Administrador']} />} />
      <Route path="/admin/orders" element={<PrivateRoute element={<Orders />} allowedRoles={['Administrador', 'Técnico']} />} />
      <Route path="/admin/orders/create" element={<PrivateRoute element={<CreateOrder />} allowedRoles={['Administrador']} />} />
      <Route path="/admin/orders/:folio" element={<PrivateRoute element={<OrderDetail />} allowedRoles={['Administrador']} />} />
      <Route path="/admin/orders/deleted" element={<PrivateRoute element={<DeletedOrders />} allowedRoles={['Administrador']} />} />
      <Route path="/admin/technicians" element={<PrivateRoute element={<Technicians />} allowedRoles={['Administrador']} />} />
      <Route path="/technician" element={<PrivateRoute element={<TechnicianOrders />} allowedRoles={['Administrador']} />} />
      <Route path="/technician/order/:id" element={<PrivateRoute element={<TechnicianOrderDetail />} allowedRoles={['Administrador']} />} />
      <Route path="/public/create" element={<PrivateRoute element={<PublicOrderCreate />} allowedRoles={['Administrador']} />} />
      <Route path="/public/lookup" element={<PrivateRoute element={<PublicOrderLookup />} allowedRoles={['Administrador']} />} />
      <Route path="/servicios-foraneos" element={<PrivateRoute element={<ForeignServices />} allowedRoles={['Administrador', 'Técnico']} />} />
      <Route path="/servicios-foraneos/crear" element={<PrivateRoute element={<ForeignServicesCreate />} allowedRoles={['Administrador']} />} />
      <Route path="/ordenes-clientes" element={<PrivateRoute element={<OrdenesClientes />} allowedRoles={['Administrador', 'Técnico']} />} />
      <Route path="/ordenes-clientes/:id" element={<PrivateRoute element={<OrdenClienteDetalle />} allowedRoles={['Administrador', 'Técnico']} />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
