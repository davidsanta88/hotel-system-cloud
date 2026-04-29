import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Rooms from './pages/Rooms';
import Registros from './pages/Registros';
import Clientes from './pages/Clientes';
import Empresas from './pages/Empresas';
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
import Solicitudes from './pages/Solicitudes';
import ConfigNotificaciones from './pages/ConfigNotificaciones';
import Housekeeping from './pages/Housekeeping';
import Mantenimiento from './pages/Mantenimiento';
import CheckinPublico from './pages/CheckinPublico';
import CheckinAdmin from './pages/CheckinAdmin';
import Estadisticas from './pages/Estadisticas';
import MapaHabitaciones from './pages/MapaHabitaciones';
import MapaHabitacionesConsolidado from './pages/MapaHabitacionesConsolidado';
import HotelConfig from './pages/HotelConfig';
import CuadreCaja from './pages/CuadreCaja';
import AuditoriaLimpieza from './pages/AuditoriaLimpieza';
import ComparativaHoteles from './pages/ComparativaHoteles';
import ReservasConsolidadas from './pages/ReservasConsolidadas';
import Cotizaciones from './pages/Cotizaciones';
import InvitacionReligiosa from './pages/InvitacionReligiosa';
import ReporteIngresos from './pages/ReporteIngresos';
import ReporteIngresosConsolidado from './pages/ReporteIngresosConsolidado';
import CalendarioIngresos from './pages/CalendarioIngresos';
import RentabilidadHabitaciones from './pages/RentabilidadHabitaciones';
import Manuales from './pages/Manuales';
import Restaurante from './pages/Restaurante';
import CajaDiariaConsolidada from './pages/CajaDiariaConsolidada';
import Proveedores from './pages/Proveedores';
import DocumentosHotel from './pages/DocumentosHotel';
import Layout from './components/Layout/Layout';

const PrivateRoute = ({ children, roles, code }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // SuperAdmin override: acceso total para Admin
  const isSuperAdmin = user?.rol_id === 1 || user?.rol_nombre?.toLowerCase()?.includes('admin') || user?.nombre === 'Administrador' || user?.email === 'admin@hotel.com';
  if (isSuperAdmin) return children;

  // if roles specifies required roles
  if (roles && !roles.includes(user.rol_id)) {
      return <Navigate to="/" />; // Or unauthorized page
  }

  if (code) {
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
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="mapa-habitaciones" element={<MapaHabitaciones />} />
                <Route path="mapa-habitaciones-consolidado" element={<PrivateRoute code="mapa_habitaciones_consolidado"><MapaHabitacionesConsolidado /></PrivateRoute>} />
                <Route path="habitaciones" element={<PrivateRoute code="habitaciones"><Rooms /></PrivateRoute>} />
                <Route path="registros" element={<PrivateRoute code="registros"><Registros /></PrivateRoute>} />
                <Route path="clientes" element={<PrivateRoute code="clientes"><Clientes /></PrivateRoute>} />
                <Route path="empresas" element={<PrivateRoute code="empresas"><Empresas /></PrivateRoute>} />
                <Route path="municipios" element={<PrivateRoute code="municipios"><Municipios /></PrivateRoute>} />
                <Route path="tipos-habitaciones" element={<PrivateRoute code="tipos_habitaciones"><TiposHabitacion /></PrivateRoute>} />
                <Route path="estados-habitaciones" element={<PrivateRoute code="estados_habitaciones"><EstadosHabitacion /></PrivateRoute>} />
                <Route path="medios-pago" element={<PrivateRoute code="medios_pago"><MediosPago /></PrivateRoute>} />
                <Route path="categorias-productos" element={<PrivateRoute code="categorias_productos"><CategoriasProductos /></PrivateRoute>} />
                <Route path="categorias-gastos" element={<PrivateRoute code="categorias_gastos"><CategoriasGastos /></PrivateRoute>} />
                <Route path="gastos" element={<PrivateRoute code="gastos"><Gastos /></PrivateRoute>} />
                <Route path="reservas" element={<PrivateRoute code="reservas"><Reservas /></PrivateRoute>} />
                <Route path="reportes" element={<PrivateRoute code="reportes"><Reports /></PrivateRoute>} />
                <Route path="cuadre-caja" element={<PrivateRoute code="cuadre_caja"><CuadreCaja /></PrivateRoute>} />
                <Route path="tienda" element={<PrivateRoute code="tienda"><Store /></PrivateRoute>} />
                <Route path="inventario" element={<PrivateRoute code="inventario"><Inventory /></PrivateRoute>} />
                <Route path="usuarios" element={<PrivateRoute code="usuarios"><Usuarios /></PrivateRoute>} />
                <Route path="tipos-registro" element={<PrivateRoute code="tipos_registro"><TiposRegistro /></PrivateRoute>} />
                <Route path="roles" element={<PrivateRoute code="roles_permisos"><Roles /></PrivateRoute>} />
                <Route path="notas" element={<PrivateRoute code="notas"><Notas /></PrivateRoute>} />
                <Route path="restaurante" element={<PrivateRoute code="restaurante"><Restaurante /></PrivateRoute>} />
                <Route path="solicitudes" element={<Solicitudes />} />
                <Route path="notificaciones" element={<PrivateRoute><ConfigNotificaciones /></PrivateRoute>} />
                <Route path="mantenimiento" element={<PrivateRoute code="mantenimiento"><Mantenimiento /></PrivateRoute>} />
                <Route path="aseo" element={<PrivateRoute code="aseo"><Housekeeping /></PrivateRoute>} />
                <Route path="auditoria-limpieza" element={<PrivateRoute code="auditoria_limpieza"><AuditoriaLimpieza /></PrivateRoute>} />
                <Route path="checkin-digital" element={<PrivateRoute code="checkin_digital"><CheckinAdmin /></PrivateRoute>} />
                <Route path="estadisticas" element={<PrivateRoute code="estadisticas"><Estadisticas /></PrivateRoute>} />
                <Route path="comparativa" element={<PrivateRoute code="comparativa"><ComparativaHoteles /></PrivateRoute>} />
                <Route path="reservas-consolidadas" element={<PrivateRoute code="reservas_consolidadas"><ReservasConsolidadas /></PrivateRoute>} />
                <Route path="cotizaciones" element={<PrivateRoute code="cotizaciones"><Cotizaciones /></PrivateRoute>} />
                <Route path="invitacion-religiosa" element={<PrivateRoute code="invitacion"><InvitacionReligiosa /></PrivateRoute>} />
                <Route path="reporte-ingresos" element={<PrivateRoute code="reporte_ingresos"><ReporteIngresos /></PrivateRoute>} />
                <Route path="reporte-ingresos-consolidado" element={<PrivateRoute code="reporte_ingresos_consolidado"><ReporteIngresosConsolidado /></PrivateRoute>} />
                <Route path="caja-diaria-consolidada" element={<PrivateRoute code="comparativa"><CajaDiariaConsolidada /></PrivateRoute>} />
                <Route path="proveedores" element={<PrivateRoute code="empresas"><Proveedores /></PrivateRoute>} />
                <Route path="documentos-hotel" element={<PrivateRoute code="configuracion"><DocumentosHotel /></PrivateRoute>} />
                <Route path="calendario-ingresos" element={<PrivateRoute code="calendario_ingresos"><CalendarioIngresos /></PrivateRoute>} />
                <Route path="rentabilidad-habitaciones" element={<PrivateRoute code="rentabilidad"><RentabilidadHabitaciones /></PrivateRoute>} />
                <Route path="config" element={<PrivateRoute code="configuracion"><HotelConfig /></PrivateRoute>} />
                <Route path="manuales" element={<Manuales />} />
            </Route>
            <Route path="/checkin" element={<CheckinPublico />} />
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
