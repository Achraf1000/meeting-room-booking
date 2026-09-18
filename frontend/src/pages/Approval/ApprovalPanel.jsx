import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { Modal } from '../../components/Common/Modal';
import { CheckCircle2, XCircle } from 'lucide-react';

export const ApprovalPanel = () => {
  const [pendingList, setPendingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState({ open: false, type: '', booking: null });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reservations/pending');
      setPendingList(res.data);
    } catch (err) {
      console.error('Erreur chargement réservations en attente:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const openAction = (booking, type) => {
    setActionModal({ open: true, type, booking });
    setComment('');
  };

  const handleConfirmAction = async () => {
    if (!actionModal.booking) return;
    setSubmitting(true);
    try {
      const endpoint = `/api/reservations/${actionModal.booking.id}/${actionModal.type}`;
      await api.put(endpoint, { comment });
      setActionModal({ open: false, type: '', booking: null });
      fetchPending();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors du traitement de la demande');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Espace d'Approbation Admin</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
          Validez ou rejetez les demandes de réservations soumises par les collaborateurs
        </p>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Chargement des demandes en attente...
        </div>
      ) : pendingList.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          ✅ Aucune demande en attente d'approbation.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {pendingList.map((item) => (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '20px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '700px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{item.title}</h3>
                  <StatusBadge status="pending" />
                </div>

                <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  <span>🏢 Salle : <strong>{item.room_name}</strong></span>
                  <span>👤 Demande de : <strong>{item.user_name}</strong> ({item.department || 'Non renseigné'})</span>
                  <span>📧 {item.user_email}</span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--primary-700)', background: 'rgba(217,136,78,0.1)', padding: '6px 12px', borderRadius: '4px', display: 'inline-block', width: 'fit-content' }}>
                  📅 <strong>{item.reservation_date}</strong> de <strong>{item.start_time.substring(0, 5)}</strong> à <strong>{item.end_time.substring(0, 5)}</strong>
                </div>

                {item.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontStyle: 'italic', marginTop: '4px' }}>
                    "{item.description}"
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => openAction(item, 'approve')}
                  className="btn btn-success"
                  style={{ padding: '10px 18px' }}
                >
                  <CheckCircle2 size={18} /> Approuver
                </button>
                <button
                  onClick={() => openAction(item, 'reject')}
                  className="btn btn-danger"
                  style={{ padding: '10px 18px' }}
                >
                  <XCircle size={18} /> Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation & Comment Modal */}
      <Modal
        isOpen={actionModal.open}
        onClose={() => setActionModal({ open: false, type: '', booking: null })}
        title={actionModal.type === 'approve' ? 'Approuver la réservation' : 'Rejeter la réservation'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Vous allez {actionModal.type === 'approve' ? 'approuver' : 'rejeter'} la demande "
            <strong>{actionModal.booking?.title}</strong>" de <strong>{actionModal.booking?.user_name}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">Remarque ou Motif (facultatif)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="ex: Merci de libérer la salle à l'heure exacte."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setActionModal({ open: false, type: '', booking: null })}
            >
              Annuler
            </button>
            <button
              className={`btn ${actionModal.type === 'approve' ? 'btn-success' : 'btn-danger'}`}
              onClick={handleConfirmAction}
              disabled={submitting}
            >
              {submitting ? 'Traitement...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
