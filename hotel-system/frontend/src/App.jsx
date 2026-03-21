import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Registros from './pages/Registros';
import Clientes from './pages/Clientes';
import Municipios from './pages/Municipios';
import TiposHabitacion from './pages/TiposHabitacion';
import EstadosHabitacion from './pages/EstadosHabitacion';
import MediosPago from './pages/MediosPago';
import Store from './pages/Store';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';
import CategoriasProductos from './pages/CategoriasProductos';
import Gastos from './pages/Gastos';
import CategoriasGastos from './pages/CategoriasGastos';
import Reservas from './pages/Reservas';
import Usuarios from './pages/Usuarios';
import Roles from './pages/Roles';
import TiposRegistro from './pages/TiposRegistro';
import Notas from './pages/Notas';
import Layout from './components/Layout/Layout';

const PrivateRoute = ({ children, roles, code }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // if roles specifies required roles
  if (roles && !roles.includes(user.rol_id)) {
      return <Navigate to="/" />; // Or unauthorized page
  }

  if (code) {
      if (user.rol_id === 1) return children; // SuperAdmin override
      // Validar si p.p coincide con el código de pantalla y p.v (Ver) es true
      if (!user.permisos || !user.permisos.some(p => p.p === code && p.v)) {
          return <Navigate to="/" />; // Access denied mapping
      }
  }

  return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route index element={<Dashboard />} />
                <Route path="habitaciones" element={<PrivateRoute code="habitaciones"><Rooms /></PrivateRoute>} />
                <Route path="registros" element={<PrivateRoute code="registros"><Registros /></PrivateRoute>} />
                <Route path="clientes" element={<PrivateRoute code="clientes"><Clientes /></PrivateRoute>} />
                <Route path="municipios" element={<PrivateRoute code="municipios"><Municipios /></PrivateRoute>} />
                <Route path="tipos-habitaciones" element={<PrivateRoute code="tipos_habitaciones"><TiposHabitacion /></PrivateRoute>} />
                <Route path="estados-habitaciones" element={<PrivateRoute code="estados_habitaciones"><EstadosHabitacion /></PrivateRoute>} />
                <Route path="medios-pago" element={<PrivateRoute code="medios_pago"><MediosPago /></PrivateRoute>} />
                <Route path="categorias-productos" element={<PrivateRoute code="categorias_productos"><CategoriasProductos /></PrivateRoute>} />
                <Route path="categorias-gastos" element={<PrivateRoute code="categorias_gastos"><CategoriasGastos /></PrivateRoute>} />
                <Route path="gastos" element={<PrivateRoute code="gastos"><Gastos /></PrivateRoute>} />
                <Route path="reservas" element={<PrivateRoute code="reservas"><Reservas /></PrivateRoute>} />
                <Route path="reportes" element={<PrivateRoute code="reportes"><Reports /></PrivateRoute>} />
                <Route path="tienda" element={<PrivateRoute code="tienda"><Store /></PrivateRoute>} />
                <Route path="inventario" element={<PrivateRoute code="inventario"><Inventory /></PrivateRoute>} />
                <Route path="usuarios" element={<PrivateRoute code="usuarios"><Usuarios /></PrivateRoute>} />
                <Route path="tipos-registro" element={<PrivateRoute code="tipos_registro"><TiposRegistro /></PrivateRoute>} />
                <Route path="roles" element={<PrivateRoute code="roles_permisos"><Roles /></PrivateRoute>} />
                <Route path="notas" element={<PrivateRoute code="notas"><Notas /></PrivateRoute>} />
            </Route>
        </Routes>
    );
};

function App() {
  return (
    <AuthProvider>
        <BrowserRouter>
            <AppRoutes />
        </BrowserRouter>
    </AuthProvider>
  )
}

export default App;
