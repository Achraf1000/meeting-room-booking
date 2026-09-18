import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { Calendar, Clock, CheckCircle2, DoorOpen } from 'lucide-react';
import './Dashboard.css';

export const UserDashboard = () => {
  const { user } = useAuth();
  const [myReservations, setMyReservations] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [myRes, todayRes, roomsRes] = await Promise.all([
          api.get('/api/reservations/my'),
          api.get('/api/reservations/today'),
          api.get('/api/rooms'),
        ]);
        setMyReservations(myRes.data);
        setTodayBookings(todayRes.data);
        setRooms(roomsRes.data);
      } catch (err) {
        console.error('Erreur chargement tableau de bord:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const pendingCount = myReservations.filter((r) => r.status === 'pending').length;
  const approvedCount = myReservations.filter((r) => r.status === 'approved').length;

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-welcome">
        <div>
          <h1 className="welcome-title">Bienvenue, {user?.full_name} 👋</h1>
          <p className="welcome-sub">
            Espace collaborateur • Service {user?.department || 'Général'}
          </p>
        </div>
        <Link to="/planning" className="btn btn-primary">
          <Calendar size={18} /> Consulter le Planning Complexe
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary-500)' }}>
            <Calendar size={28} />
          </div>
          <div>
            <div className="stat-val">{myReservations.length}</div>
            <div className="stat-lbl">Mes Réservations Totales</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--status-pending-text)' }}>
            <Clock size={28} />
          </div>
          <div>
            <div className="stat-val">{pendingCount}</div>
            <div className="stat-lbl">En Attente de Validation</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--status-approved-text)' }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <div className="stat-val">{approvedCount}</div>
            <div className="stat-lbl">Demandes Approuvées</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(13, 148, 136, 0.15)', color: 'var(--accent-teal)' }}>
            <DoorOpen size={28} />
          </div>
          <div>
            <div className="stat-val">{rooms.length}</div>
            <div className="stat-lbl">Salles Disponibles (08h-19h)</div>
          </div>
        </div>
      </div>

      {/* Dashboard Main Grid */}
      <div className="dashboard-grid">
        {/* Recent User Reservations */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Mes Demandes Récentes</h3>
            <Link to="/my-reservations" style={{ color: 'var(--primary-500)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none' }}>
              Voir tout →
            </Link>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
          ) : myReservations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Vous n'avez aucune réservation en cours.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myReservations.slice(0, 5).map((res) => (
                <div
                  key={res.id}
                  style={{
                    padding: '14px 18px',
                    background: 'rgba(0, 0, 0, 0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{res.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      🏢 {res.room_name} • 📅 {res.reservation_date} ({res.start_time.substring(0, 5)} - {res.end_time.substring(0, 5)})
                    </p>
                  </div>
                  <StatusBadge status={res.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Meetings in Company */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>
            📅 Réunions d'Aujourd'hui
          </h3>
          {todayBookings.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Aucune réunion prévue aujourd'hui.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayBookings.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: '12px',
                    background: 'rgba(13, 148, 136, 0.1)',
                    borderLeft: '3px solid var(--accent-teal)',
                    borderRadius: '4px',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {b.room_name} • {b.start_time.substring(0, 5)} - {b.end_time.substring(0, 5)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-teal)', marginTop: '4px', fontWeight: 600 }}>
                    Par {b.user_name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
