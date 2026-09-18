import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { Trash2 } from 'lucide-react';

export const MyReservations = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyReservations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reservations/my');
      setList(res.data);
    } catch {
      setError('Erreur lors de la récupération de vos réservations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReservations();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Voulez-vous vraiment annuler cette réservation ?')) return;
    try {
      await api.delete(`/api/reservations/${id}`);
      fetchMyReservations();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de l\'annulation');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Mes Réservations</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
          Suivez le statut de vos demandes de réservation et annulez celles en attente si nécessaire
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Chargement de vos demandes...
        </div>
      ) : list.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Vous n'avez soumis aucune demande de réservation pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {list.map((res) => (
            <div
              key={res.id}
              className="glass-panel glass-panel-interactive"
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{res.title}</h3>
                  <StatusBadge status={res.status} />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  🏢 <strong>{res.room_name}</strong> • 📅 <strong>{res.reservation_date}</strong> de <strong>{res.start_time.substring(0, 5)}</strong> à <strong>{res.end_time.substring(0, 5)}</strong>
                </div>
                {res.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                    {res.description}
                  </p>
                )}
                {res.admin_comment && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary-200)', marginTop: '4px', fontStyle: 'italic' }}>
                    Remarque Admin : "{res.admin_comment}"
                  </div>
                )}
              </div>

              {res.status === 'pending' && (
                <button
                  onClick={() => handleCancel(res.id)}
                  className="btn btn-danger"
                  style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <Trash2 size={16} /> Annuler
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
