import { createContext, useContext, useEffect, useState } from 'react';
import { Routes, Route, Navigate, NavLink, Link, useNavigate } from 'react-router-dom';
import { api } from './api';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentHome from './pages/ResidentHome';
import AdminHome from './pages/AdminHome';
import ComplaintDetail from './pages/ComplaintDetail';
import Notices from './pages/Notices';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

function Layout({ children }) {
  const { user, logout } = useAuth();
  return (
    <div className="app">
      <header className="header">
        <Link to={user?.role === 'admin' ? '/admin' : '/'} className="logo">
          <span className="logo-icon">🏢</span>
          Society Maintenance Tracker
        </Link>
        <nav>
          {user && (
            <>
              <NavLink to="/notices" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Notices</NavLink>
              {user.role === 'admin' ? (
                <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
              ) : (
                <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>My Complaints</NavLink>
              )}
              <span className="user-badge">
                {user.name}
                <span className={`role-pill ${user.role}`}>{user.role}</span>
              </span>
              <button type="button" className="btn btn-ghost" onClick={logout}>Logout</button>
            </>
          )}
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading">
      <div className="spinner" />
      <span>Loading your workspace...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    setUser(data.user);
    navigate(data.user.role === 'admin' ? '/admin' : '/');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute role="resident">
            <Layout><ResidentHome /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin">
            <Layout><AdminHome /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/complaints/:id" element={
          <ProtectedRoute>
            <Layout><ComplaintDetail /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/notices" element={
          <ProtectedRoute>
            <Layout><Notices /></Layout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to={user?.role === 'admin' ? '/admin' : '/'} replace />} />
      </Routes>
    </AuthContext.Provider>
  );
}
