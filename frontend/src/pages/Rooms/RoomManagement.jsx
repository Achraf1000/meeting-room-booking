import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Modal } from '../../components/Common/Modal';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 10,
    floor: '',
    description: '',
    equipment: '',
  });
  const [error, setError] = useState('');

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error('Erreur chargement salles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name,
        capacity: room.capacity,
        floor: room.floor || '',
        description: room.description || '',
        equipment: (room.equipment || []).join(', '),
      });
    } else {
      setEditingRoom(null);
      setFormData({
        name: '',
        capacity: 10,
        floor: '',
        description: '',
        equipment: 'Vidéoprojecteur, Tableau blanc, WiFi, Climatisation',
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const equipArray = formData.equipment
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const payload = {
      name: formData.name,
      capacity: parseInt(formData.capacity),
      floor: formData.floor,
      description: formData.description,
      equipment: equipArray,
    };

    try {
      if (editingRoom) {
        await api.put(`/api/rooms/${editingRoom.id}`, payload);
      } else {
        await api.post('/api/rooms', payload);
      }
      setIsModalOpen(false);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors de l\'enregistrement de la salle');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous désactiver cette salle ?')) return;
    try {
      await api.delete(`/api/rooms/${id}`);
      fetchRooms();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Gestion des Salles de Réunion</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Ajoutez, modifiez ou configurez les salles disponibles pour les réservations
          </p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} /> Ajouter une Salle
        </button>
      </div>

      {loading ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Chargement des salles...
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {rooms.map((room) => (
            <div key={room.id} className="glass-panel glass-panel-interactive" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-200)' }}>{room.name}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {room.floor || 'Étage non spécifié'}</p>
                  </div>
                  <span style={{ padding: '4px 10px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary-500)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700 }}>
                    👥 {room.capacity} places
                  </span>
                </div>

                {room.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginBottom: '14px' }}>
                    {room.description}
                  </p>
                )}

                <div>
                  <span className="form-label" style={{ fontSize: '0.75rem' }}>Équipements :</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                    {(room.equipment || []).map((eq, idx) => (
                      <span key={idx} style={{ padding: '3px 8px', background: 'rgba(0,0,0,0.04)', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ✓ {eq}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <button onClick={() => handleOpenModal(room)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                  <Edit2 size={14} /> Éditer
                </button>
                <button onClick={() => handleDelete(room.id)} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Modifier la salle' : 'Ajouter une nouvelle salle'}
      >
        {error && (
          <div style={{ padding: '12px', background: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nom de la salle</label>
            <input
              type="text"
              className="form-control"
              placeholder="ex: Salle de Réunion C"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Capacité (personnes)</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Étage / Emplacement</label>
              <input
                type="text"
                className="form-control"
                placeholder="ex: 1er Étage"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Description synthétique de la salle..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Équipements (séparés par des virgules)</label>
            <input
              type="text"
              className="form-control"
              placeholder="Vidéoprojecteur, Visioconférence, Tableau blanc"
              value={formData.equipment}
              onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary">
              {editingRoom ? 'Enregistrer les modifications' : 'Créer la salle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
