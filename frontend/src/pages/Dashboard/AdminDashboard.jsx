import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { Clock, CheckCircle2, XCircle, ShieldCheck, Users, ArrowRight } from 'lucide-react';
import './Dashboard.css';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({ total: 0, pending_count: 0, approved_count: 0, rejected_count: 0 });
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [statsRes, pendingRes] = await Promise.all([
          api.get('/api/reservations/stats'),
          api.get('/api/reservations/pending'),
        ]);
        setStats(statsRes.data || { total: 0, pending_count: 0, approved_count: 0, rejected_count: 0 });
        setPendingList(pendingRes.data || []);
      } catch (err) {
        console.error('Erreur chargement admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  return (
    <div className="dashboard-container animate-fade-in">
      <div className="dashboard-welcome">
        <div>
          <h1 className="welcome-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Administration des réservations <ShieldCheck style={{ color: '#f87171' }} size={28} />
          </h1>
          <p className="welcome-sub">
            Gestion centrale des approbations et paramétrage des salles
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/admin/approval" className="btn btn-primary">
            Approuver des Demandes ({pendingList.length})
          </Link>
          <Link to="/admin/rooms" className="btn btn-secondary">
            Gérer les Salles
          </Link>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="stats-grid">
        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: 'var(--status-pending-text)' }}>
            <Clock size={28} />
          </div>
          <div>
            <div className="stat-val">{stats.pending_count || 0}</div>
            <div className="stat-lbl">Demandes En Attente</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--status-approved-text)' }}>
            <CheckCircle2 size={28} />
          </div>
          <div>
            <div className="stat-val">{stats.approved_count || 0}</div>
            <div className="stat-lbl">Réservations Approuvées</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--status-rejected-text)' }}>
            <XCircle size={28} />
          </div>
          <div>
            <div className="stat-val">{stats.rejected_count || 0}</div>
            <div className="stat-lbl">Réservations Rejetées</div>
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: 'var(--primary-500)' }}>
            <Users size={28} />
          </div>
          <div>
            <div className="stat-val">{stats.total || 0}</div>
            <div className="stat-lbl">Total Réservations</div>
          </div>
        </div>
      </div>

      {/* Pending Action Workspace */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Demandes Nécessitant une Action Immédiate
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Approuvez ou rejetez les demandes de réservations soumises par les collaborateurs
            </p>
          </div>
          <Link to="/admin/approval" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            Accéder au Panel d'Approbation <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
        ) : pendingList.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-sm)' }}>
            🎉 Aucune demande en attente. Tout est à jour !
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pendingList.slice(0, 5).map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '16px',
                  background: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    🏢 {item.room_name} • 👤 {item.user_name} ({item.department || 'Non renseigné'})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-200)', marginTop: '2px' }}>
                    📅 {item.reservation_date} de {item.start_time.substring(0, 5)} à {item.end_time.substring(0, 5)}
                  </div>
                </div>
                <StatusBadge status="pending" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
