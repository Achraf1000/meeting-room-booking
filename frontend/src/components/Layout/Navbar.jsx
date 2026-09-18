import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, CheckSquare, DoorOpen, LogOut, LayoutDashboard, UserCheck, History } from 'lucide-react';
import { Logo } from '../Common/Logo';
import './Navbar.css';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="nav-brand-link">
        <Logo size="sm" showText={true} />
      </NavLink>

      <div className="nav-links">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          Tableau de bord
        </NavLink>

        <NavLink
          to="/planning"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Calendar size={18} />
          Planning
        </NavLink>

        {!isAdmin && (
          <NavLink
            to="/my-reservations"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <CheckSquare size={18} />
            Mes Réservations
          </NavLink>
        )}

        {isAdmin && (
          <>
            <NavLink
              to="/admin/approval"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <UserCheck size={18} />
              Approbations
            </NavLink>

            <NavLink
              to="/admin/history"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <History size={18} />
              Historique
            </NavLink>

            <NavLink
              to="/admin/rooms"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <DoorOpen size={18} />
              Gestion Salles
            </NavLink>
          </>
        )}
      </div>

      <div className="nav-user">
        <NavLink to="/account" className={({ isActive }) => `user-pill ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="avatar">
            {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.full_name}</span>
            <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}>
              {isAdmin ? 'Administrateur' : 'Utilisateur'}
            </span>
          </div>
        </NavLink>

        <button onClick={handleLogout} className="btn btn-secondary" title="Déconnexion" style={{ padding: '8px 12px' }}>
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
};
