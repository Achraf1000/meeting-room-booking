import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { StatusBadge } from '../../components/Common/StatusBadge';
import { Modal } from '../../components/Common/Modal';
import { History, RotateCcw, CheckCircle2, XCircle, MessageSquare } from 'lucide-react';

export const ApprovalHistory = () => {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [changeModal, setChangeModal] = useState({ open: false, booking: null, newStatus: '' });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/reservations/history');
      setHistoryList(res.data);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredList = filter === 'all'
    ? historyList
    : historyList.filter((item) => item.status === filter);

  const openChangeModal = (booking, newStatus) => {
    setChangeModal({ open: true, booking, newStatus });
    setComment('');
  };

  const handleChangeStatus = async () => {
    if (!changeModal.booking) return;
    setSubmitting(true);
    try {
      await api.put(`/api/reservations/${changeModal.booking.id}/change-status`, {
        status: changeModal.newStatus,
        comment,
      });
      setChangeModal({ open: false, booking: null, newStatus: '' });
      fetchHistory();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors du changement de statut');
    } finally {
      setSubmitting(false);
    }
  };

  const statusLabel = {
    approved: 'Approuver',
    rejected: 'Rejeter',
    pending: 'Remettre en attente',
  };

  const statusBtnClass = {
    approved: 'btn-success',
    rejected: 'btn-danger',
    pending: 'btn-secondary',
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <History size={28} style={{ color: 'var(--accent-warm, #d9884e)' }} />
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Historique d'Approbation</h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
          Consultez et corrigez les décisions d'approbation précédentes
        </p>
      </div>

      {/* Filter bar */}
      <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Filtrer :</span>
        {['all', 'approved', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 14px', fontSize: '0.82rem' }}
          >
            {f === 'all' ? 'Toutes' : f === 'approved' ? '✅ Approuvées' : '❌ Rejetées'}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
          {filteredList.length} résultat{filteredList.length !== 1 ? 's' : ''}
        </span>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Chargement de l'historique...
        </div>
      ) : filteredList.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Aucune réservation traitée pour le moment.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredList.map((item) => (
            <div
              key={item.id}
              className="glass-panel"
              style={{
                padding: '22px 24px',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                borderLeft: `4px solid ${item.status === 'approved' ? 'var(--status-approved-text)' : 'var(--status-rejected-text)'}`,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{item.title}</h3>
                  <StatusBadge status={item.status} />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                  <span>🏢 <strong>{item.room_name}</strong></span>
                  <span>👤 <strong>{item.user_name}</strong> ({item.department || 'Non renseigné'})</span>
                  <span>📧 {item.user_email}</span>
                </div>

                <div style={{
                  fontSize: '0.82rem',
                  color: 'var(--primary-200)',
                  background: 'rgba(217, 136, 78, 0.08)',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  width: 'fit-content',
                }}>
                  📅 <strong>{item.reservation_date}</strong> de <strong>{item.start_time?.substring(0, 5)}</strong> à <strong>{item.end_time?.substring(0, 5)}</strong>
                </div>

                {item.admin_comment && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-subtle)', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                    <MessageSquare size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>Remarque : "{item.admin_comment}"</span>
                  </div>
                )}

                {item.approved_by_name && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    Traité par : <strong>{item.approved_by_name}</strong>
                    {item.updated_at && ` • ${item.updated_at}`}
                  </div>
                )}
              </div>

              {/* Action buttons to fix mistakes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
                {item.status === 'rejected' && (
                  <button
                    onClick={() => openChangeModal(item, 'approved')}
                    className="btn btn-success"
                    style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  >
                    <CheckCircle2 size={15} /> Approuver
                  </button>
                )}
                {item.status === 'approved' && (
                  <button
                    onClick={() => openChangeModal(item, 'rejected')}
                    className="btn btn-danger"
                    style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                  >
                    <XCircle size={15} /> Rejeter
                  </button>
                )}
                <button
                  onClick={() => openChangeModal(item, 'pending')}
                  className="btn btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  <RotateCcw size={15} /> Remettre en attente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={changeModal.open}
        onClose={() => setChangeModal({ open: false, booking: null, newStatus: '' })}
        title="Corriger le statut"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Vous allez <strong>{statusLabel[changeModal.newStatus]?.toLowerCase()}</strong> la réservation "
            <strong>{changeModal.booking?.title}</strong>" de <strong>{changeModal.booking?.user_name}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">Remarque de correction (facultatif)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="ex: Correction — erreur de traitement initial."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setChangeModal({ open: false, booking: null, newStatus: '' })}
            >
              Annuler
            </button>
            <button
              className={`btn ${statusBtnClass[changeModal.newStatus] || 'btn-primary'}`}
              onClick={handleChangeStatus}
              disabled={submitting}
            >
              {submitting ? 'Traitement...' : 'Confirmer la correction'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
