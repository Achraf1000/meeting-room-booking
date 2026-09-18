import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../Common/StatusBadge';
import { Modal } from '../Common/Modal';
import { Calendar as CalendarIcon, Filter, Plus, Clock, User, DoorOpen, CheckCircle2, XCircle } from 'lucide-react';
import './PlanningView.css';

export const PlanningView = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Modal reservation creation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    room_id: '',
    title: '',
    description: '',
    reservation_date: '',
    start_time: '09:00',
    end_time: '10:00',
  });
  const [modalError, setModalError] = useState('');

  // Modal details
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Modal for multiple bookings in a single time slot
  const [slotModal, setSlotModal] = useState({
    isOpen: false,
    roomName: '',
    hour: null,
    bookings: [],
  });

  // Modal for Admin Approval/Rejection Action
  const [adminActionModal, setAdminActionModal] = useState({
    isOpen: false,
    type: '', // 'approve' | 'reject'
    booking: null,
  });
  const [adminComment, setAdminComment] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  const openAdminAction = (booking, type) => {
    setAdminActionModal({ isOpen: true, type, booking });
    setAdminComment('');
  };

  const handleConfirmAdminAction = async () => {
    if (!adminActionModal.booking) return;
    setActionSubmitting(true);
    try {
      const endpoint = `/api/reservations/${adminActionModal.booking.id}/${adminActionModal.type}`;
      await api.put(endpoint, { comment: adminComment });
      setAdminActionModal({ isOpen: false, type: '', booking: null });
      setSlotModal({ isOpen: false, roomName: '', hour: null, bookings: [] });
      setSelectedBooking(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors du traitement de la réservation');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Hours array from 8h to 18h (last slot 18h-19h)
  const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, resRes] = await Promise.all([
        api.get('/api/rooms'),
        api.get(`/api/reservations?start_date=${selectedDate}&end_date=${selectedDate}`),
      ]);
      setRooms(roomsRes.data);
      setReservations(resRes.data);
    } catch (err) {
      console.error('Erreur chargement planning:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenNewModal = (roomId = '', startHour = 9) => {
    const formattedStart = `${String(startHour).padStart(2, '0')}:00`;
    const formattedEnd = `${String(startHour + 1).padStart(2, '0')}:00`;
    setModalData({
      room_id: roomId || (rooms.length > 0 ? rooms[0].id : ''),
      title: '',
      description: '',
      reservation_date: selectedDate,
      start_time: formattedStart,
      end_time: formattedEnd,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await api.post('/api/reservations', {
        ...modalData,
        room_id: parseInt(modalData.room_id),
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setModalError(
        err.response?.data?.detail || 'Erreur lors de la réservation'
      );
    }
  };

  // Filter rooms & reservations
  const filteredRooms = rooms.filter(
    (r) => selectedRoom === 'all' || r.id === parseInt(selectedRoom)
  );

  const getSlotBookings = (roomId, hour) => {
    const timeStr = `${String(hour).padStart(2, '0')}:00`;
    return reservations.filter((res) => {
      if (res.room_id !== roomId) return false;
      if (isAdmin && selectedStatus !== 'all' && res.status !== selectedStatus) return false;
      const resStart = res.start_time.substring(0, 5);
      const resEnd = res.end_time.substring(0, 5);
      return timeStr >= resStart && timeStr < resEnd;
    });
  };

  // Check if a booking belongs to the current user
  const isOwnBooking = (booking) => booking.user_id === user?.id;

  return (
    <div className="planning-container animate-fade-in">
      <div className="planning-header">
        <div className="planning-title-group">
          <h1>Planning des Salles de Réunion</h1>
          <p>Consultez la disponibilité en temps réel de 08h00 à 19h00</p>
        </div>
        <button
          onClick={() => handleOpenNewModal()}
          className="btn btn-primary"
        >
          <Plus size={18} /> Nouvelle Réservation
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel filter-bar">
        <div className="filter-item">
          <CalendarIcon size={18} style={{ color: 'var(--primary-500)' }} />
          <label>Date :</label>
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ width: '160px', padding: '8px 12px' }}
          />
        </div>

        <div className="filter-item">
          <DoorOpen size={18} style={{ color: 'var(--accent-teal)' }} />
          <label>Salle :</label>
          <select
            className="form-control"
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            style={{ width: '200px', padding: '8px 12px' }}
          >
            <option value="all">Toutes les salles</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.capacity} pers.)
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div className="filter-item">
            <Filter size={18} style={{ color: 'var(--accent-gold, #c7ba5d)' }} />
            <label>Statut :</label>
            <select
              className="form-control"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ width: '180px', padding: '8px 12px' }}
            >
              <option value="all">Tous les statuts</option>
              <option value="approved">Approuvées</option>
              <option value="pending">En attente</option>
              <option value="rejected">Rejetées</option>
            </select>
          </div>
        )}
      </div>

      {/* Schedule Grid */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Chargement de la planification...
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="planning-grid">
            {/* Time Labels Column */}
            <div className="time-column">
              {HOURS.map((hour) => (
                <div key={hour} className="time-slot-label">
                  {String(hour).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* Room Columns */}
            {filteredRooms.map((room) => (
              <div key={room.id} className="room-column">
                <div className="room-column-header">
                  <h3>{room.name}</h3>
                  <p>{room.floor || 'Étage non renseigné'} • Max {room.capacity} personnes</p>
                </div>
                <div className="time-slots-container">
                  {HOURS.map((hour) => {
                    const slotBookings = getSlotBookings(room.id, hour);

                    if (slotBookings.length === 1) {
                      const booking = slotBookings[0];
                      const isMine = isOwnBooking(booking);
                      return (
                        <div
                          key={hour}
                          className={`booking-card-slot status-${booking.status}${isMine ? ' own-booking' : ''}`}
                          onClick={() => setSelectedBooking(booking)}
                          title={isMine ? 'Ma réservation' : `Par ${booking.user_name}`}
                        >
                          <span className="booking-title">{isMine ? `📌 ${booking.title}` : booking.title}</span>
                          <span className="booking-user">{isMine ? 'Ma réservation' : (booking.user_name || 'Utilisateur')}</span>
                        </div>
                      );
                    }

                    if (slotBookings.length > 1) {
                      const approvedCount = slotBookings.filter(b => b.status === 'approved').length;
                      const pendingCount = slotBookings.filter(b => b.status === 'pending').length;
                      const rejectedCount = slotBookings.filter(b => b.status === 'rejected').length;

                      return (
                        <div
                          key={hour}
                          className="booking-card-slot status-multi"
                          onClick={() =>
                            setSlotModal({
                              isOpen: true,
                              roomName: room.name,
                              hour,
                              bookings: slotBookings,
                            })
                          }
                          title={`${slotBookings.length} demandes à ${hour}h00. Cliquez pour ouvrir la liste complet.`}
                        >
                          <span className="booking-title" style={{ fontWeight: 800 }}>
                            📋 {slotBookings.length} demandes ({hour}h00)
                          </span>
                          <div className="multi-badge-group">
                            {approvedCount > 0 && (
                              <span className="multi-chip approved">{approvedCount} appr.</span>
                            )}
                            {pendingCount > 0 && (
                              <span className="multi-chip pending">{pendingCount} attente</span>
                            )}
                            {rejectedCount > 0 && (
                              <span className="multi-chip rejected">{rejectedCount} rej.</span>
                            )}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={hour}
                        className="slot-btn"
                        onClick={() => handleOpenNewModal(room.id, hour)}
                        title={`Réserver ${room.name} à ${hour}h00`}
                      >
                        + Réserver
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Reservation Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Nouvelle demande de réservation"
      >
        {modalError && (
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--status-rejected-bg)',
              color: 'var(--status-rejected-text)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '0.9rem',
              border: '1px solid var(--status-rejected-border)',
            }}
          >
            {modalError}
          </div>
        )}
        <form onSubmit={handleCreateReservation}>
          <div className="form-group">
            <label className="form-label">Salle de réunion</label>
            <select
              className="form-control"
              value={modalData.room_id}
              onChange={(e) => setModalData({ ...modalData, room_id: e.target.value })}
              required
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} (Capacité : {r.capacity} pers.)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Titre / Objet de la réunion</label>
            <input
              type="text"
              className="form-control"
              placeholder="ex: Réunion de suivi projet"
              value={modalData.title}
              onChange={(e) => setModalData({ ...modalData, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description (facultatif)</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Ordre du jour, participants..."
              value={modalData.description}
              onChange={(e) => setModalData({ ...modalData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              className="form-control"
              value={modalData.reservation_date}
              onChange={(e) => setModalData({ ...modalData, reservation_date: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Heure Début (08:00 - 19:00)</label>
              <input
                type="time"
                className="form-control"
                min="08:00"
                max="19:00"
                value={modalData.start_time}
                onChange={(e) => setModalData({ ...modalData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Heure Fin</label>
              <input
                type="time"
                className="form-control"
                min="08:00"
                max="19:00"
                value={modalData.end_time}
                onChange={(e) => setModalData({ ...modalData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              Envoyer la demande
            </button>
          </div>
        </form>
      </Modal>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!selectedBooking}
        onClose={() => setSelectedBooking(null)}
        title="Détails de la réservation"
      >
        {selectedBooking && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{selectedBooking.title}</h4>
              <StatusBadge status={selectedBooking.status} />
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                <DoorOpen size={16} style={{ color: 'var(--primary-500)' }} />
                <span>Salle : <strong>{selectedBooking.room_name}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                <Clock size={16} style={{ color: 'var(--accent-teal)' }} />
                <span>
                  Date & Horaire : <strong>{selectedBooking.reservation_date}</strong> de <strong>{selectedBooking.start_time.substring(0, 5)}</strong> à <strong>{selectedBooking.end_time.substring(0, 5)}</strong>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem' }}>
                <User size={16} style={{ color: 'var(--accent-purple)' }} />
                <span>Organisateur : <strong>{selectedBooking.user_name}</strong> ({selectedBooking.department || 'Non renseigné'})</span>
              </div>
            </div>

            {selectedBooking.description && (
              <div>
                <span className="form-label">Description :</span>
                <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  {selectedBooking.description}
                </p>
              </div>
            )}

            {selectedBooking.admin_comment && (
              <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderLeft: '3px solid var(--primary-500)', borderRadius: '4px' }}>
                <span className="form-label">Remarque Admin :</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--primary-200)', marginTop: '2px' }}>
                  {selectedBooking.admin_comment}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {selectedBooking.status !== 'approved' && (
                    <button
                      className="btn btn-success"
                      style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                      onClick={() => openAdminAction(selectedBooking, 'approve')}
                    >
                      <CheckCircle2 size={16} /> Approuver
                    </button>
                  )}
                  {selectedBooking.status !== 'rejected' && (
                    <button
                      className="btn btn-danger"
                      style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                      onClick={() => openAdminAction(selectedBooking, 'reject')}
                    >
                      <XCircle size={16} /> Rejeter
                    </button>
                  )}
                </div>
              )}
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedBooking(null)}
                style={{ marginLeft: 'auto' }}
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Multiple Slot Bookings List Modal */}
      <Modal
        isOpen={slotModal.isOpen}
        onClose={() => setSlotModal({ isOpen: false, roomName: '', hour: null, bookings: [] })}
        title={`Demandes & Réservations - ${slotModal.roomName} (${String(slotModal.hour).padStart(2, '0')}:00)`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Il y a <strong>{slotModal.bookings.length} demande(s)</strong> enregistrée(s) pour ce créneau horaire.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
            {slotModal.bookings.map((booking) => (
              <div
                key={booking.id}
                style={{
                  padding: '16px',
                  background: 'rgba(0, 0, 0, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{booking.title}</h4>
                  <StatusBadge status={booking.status} />
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>👤 Demandeur : <strong>{booking.user_name}</strong> ({booking.department || 'Non renseigné'})</div>
                  <div>📧 Email : {booking.user_email}</div>
                  <div>⏰ Horaires : <strong>{booking.start_time.substring(0, 5)} - {booking.end_time.substring(0, 5)}</strong></div>
                  {booking.description && (
                    <div style={{ fontStyle: 'italic', marginTop: '2px', color: 'var(--text-subtle)' }}>
                      "{booking.description}"
                    </div>
                  )}
                  {booking.admin_comment && (
                    <div style={{ color: 'var(--primary-700)', marginTop: '2px' }}>
                      💬 Remarque admin : {booking.admin_comment}
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                    {booking.status !== 'approved' && (
                      <button
                        className="btn btn-success"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => openAdminAction(booking, 'approve')}
                      >
                        <CheckCircle2 size={14} /> Approuver
                      </button>
                    )}
                    {booking.status !== 'rejected' && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={() => openAdminAction(booking, 'reject')}
                      >
                        <XCircle size={14} /> Rejeter
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setSlotModal({ isOpen: false, roomName: '', hour: null, bookings: [] })}
            >
              Fermer
            </button>
          </div>
        </div>
      </Modal>

      {/* Admin Action Confirmation Modal */}
      <Modal
        isOpen={adminActionModal.isOpen}
        onClose={() => setAdminActionModal({ isOpen: false, type: '', booking: null })}
        title={adminActionModal.type === 'approve' ? 'Approuver la demande' : 'Rejeter la demande'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
            Vous allez {adminActionModal.type === 'approve' ? 'approuver' : 'rejeter'} la réservation "
            <strong>{adminActionModal.booking?.title}</strong>" de <strong>{adminActionModal.booking?.user_name}</strong>.
          </p>

          <div className="form-group">
            <label className="form-label">Remarque ou Motif (facultatif)</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="ex: Merci de respecter la capacité de la salle."
              value={adminComment}
              onChange={(e) => setAdminComment(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setAdminActionModal({ isOpen: false, type: '', booking: null })}
            >
              Annuler
            </button>
            <button
              className={`btn ${adminActionModal.type === 'approve' ? 'btn-success' : 'btn-danger'}`}
              onClick={handleConfirmAdminAction}
              disabled={actionSubmitting}
            >
              {actionSubmitting ? 'Traitement...' : 'Confirmer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
