import React from 'react';
import { useAuthStore } from '../store/authStore';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import AdminDashboard from '../pages/AdminDashboard';
import Orders from '../pages/Orders';
import Quotes from '../pages/Quotes';
import QuotesList from '../pages/QuotesList';
import QuoteDetail from '../pages/QuoteDetail';
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
import ClientesManagement from '../pages/ClientesManagement';


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
  
  if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(normalizedRole)) {
    return <NotFound />;
  }
  
  return element;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login_magic" element={<Login />} />
      <Route path="/consulta-tu-orden" element={<ConsultaPublica />} />
      <Route path="/solicitar-orden-cliente" element={<SolicitarOrdenCliente />} />
      <Route path="/admin" element={<PrivateRoute element={<AdminDashboard />} allowedRoles={['Administrador', 'admin']} />} />
      <Route path="/admin/dashboard" element={<PrivateRoute element={<AdminDashboard />} allowedRoles={['Administrador', 'admin']} />} />
      <Route path="/admin/orders" element={<PrivateRoute element={<Orders />} allowedRoles={['Administrador', 'admin', 'Técnico', 'tecnico', 'Mostrador', 'mostrador']} />} />
      <Route path="/admin/quotes" element={<PrivateRoute element={<QuotesList />} allowedRoles={['Administrador', 'admin', 'Mostrador', 'mostrador']} />} />
      <Route path="/admin/quotes/create" element={<PrivateRoute element={<Quotes />} allowedRoles={['Administrador', 'admin', 'Mostrador', 'mostrador']} />} />
      <Route path="/admin/quotes/:id" element={<PrivateRoute element={<QuoteDetail />} allowedRoles={['Administrador', 'admin', 'Mostrador', 'mostrador']} />} />
      <Route path="/admin/orders/create" element={<PrivateRoute element={<CreateOrder />} allowedRoles={['Administrador', 'admin', 'Mostrador', 'mostrador']} />} />
      <Route path="/admin/orders/:folio" element={<PrivateRoute element={<OrderDetail />} allowedRoles={['Administrador', 'admin', 'Mostrador', 'mostrador']} />} />
      <Route path="/admin/orders/deleted" element={<PrivateRoute element={<DeletedOrders />} allowedRoles={['Administrador', 'admin']} />} />
      <Route path="/admin/technicians" element={<PrivateRoute element={<Technicians />} allowedRoles={['Administrador', 'admin']} />} />
      <Route path="/admin/clientes" element={<PrivateRoute element={<ClientesManagement />} allowedRoles={['Administrador', 'admin']} />} />
      <Route path="/technician" element={<PrivateRoute element={<TechnicianOrders />} allowedRoles={['Administrador']} />} />
      <Route path="/technician/order/:id" element={<PrivateRoute element={<TechnicianOrderDetail />} allowedRoles={['Administrador']} />} />
      <Route path="/public/create" element={<PrivateRoute element={<PublicOrderCreate />} allowedRoles={['Administrador']} />} />
      <Route path="/public/lookup" element={<PrivateRoute element={<PublicOrderLookup />} allowedRoles={['Administrador']} />} />
      <Route path="/servicios-externos" element={<PrivateRoute element={<ForeignServices />} allowedRoles={['Administrador', 'admin', 'Técnico', 'tecnico', 'Mostrador', 'mostrador']} />} />
      <Route path="/servicios-externos/crear" element={<PrivateRoute element={<ForeignServicesCreate />} allowedRoles={['Administrador', 'admin', 'Mostrador', 'mostrador']} />} />
      <Route path="/ordenes-clientes" element={<PrivateRoute element={<OrdenesClientes />} allowedRoles={['Administrador', 'admin', 'Técnico', 'tecnico', 'Mostrador', 'mostrador']} />} />
      <Route path="/ordenes-clientes/:id" element={<PrivateRoute element={<OrdenClienteDetalle />} allowedRoles={['Administrador', 'admin', 'Técnico', 'tecnico', 'Mostrador', 'mostrador']} />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
