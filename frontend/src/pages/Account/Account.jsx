import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { User, Lock, Save, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import './Account.css';

export const Account = () => {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setDepartment(user.department || '');
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!fullName.trim()) {
      setProfileError('Le nom complet est obligatoire.');
      return;
    }

    setProfileLoading(true);
    try {
      await updateProfile(fullName.trim(), department.trim() || null);
      setProfileSuccess('Profil mis à jour avec succès !');
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Erreur lors de la mise à jour du profil.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Veuillez saisir votre mot de passe actuel.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas.');
      return;
    }

    setPasswordLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess('Mot de passe modifié avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Erreur lors du changement de mot de passe.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="account-container animate-fade-in">
      <div className="account-header">
        <h1>Mon Compte</h1>
        <p>Consultez et modifiez vos informations personnelles et votre sécurité.</p>
      </div>

      <div className="account-grid">
        {/* Profile Card */}
        <div className="glass-panel account-card">
          <div className="card-title-group">
            <div className="card-icon">
              <User size={20} />
            </div>
            <h2>Informations personnelles</h2>
          </div>

          <div className="profile-hero">
            <div className="profile-avatar-lg">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="profile-hero-info">
              <div className="profile-hero-name">{user?.full_name}</div>
              <div className="profile-hero-email">{user?.email}</div>
              <div style={{ marginTop: '4px' }}>
                <span className={`role-badge ${isAdmin ? 'role-admin' : 'role-user'}`}>
                  {isAdmin ? 'Administrateur' : 'Utilisateur'}
                </span>
              </div>
            </div>
          </div>

          {profileSuccess && (
            <div className="alert-message alert-success">
              <CheckCircle2 size={16} />
              {profileSuccess}
            </div>
          )}

          {profileError && (
            <div className="alert-message alert-error">
              <AlertCircle size={16} />
              {profileError}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nom complet</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Adresse email (Non modifiable)</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="form-control"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Département / Service</label>
              <input
                type="text"
                className="form-control"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Ex: IT, Ressources Humaines, Finance..."
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rôle d'accès</label>
              <input
                type="text"
                className="form-control"
                value={isAdmin ? 'Administrateur' : 'Utilisateur'}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed', backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={profileLoading}
              style={{ marginTop: '8px', alignSelf: 'flex-start' }}
            >
              <Save size={16} />
              {profileLoading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>

        {/* Security Card */}
        <div className="glass-panel account-card">
          <div className="card-title-group">
            <div className="card-icon" style={{ background: 'rgba(59, 155, 155, 0.12)', color: 'var(--accent-cool)' }}>
              <Shield size={20} />
            </div>
            <h2>Sécurité & Mot de passe</h2>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Modifiez votre mot de passe pour maintenir la sécurité de votre compte.
          </p>

          {passwordSuccess && (
            <div className="alert-message alert-success">
              <CheckCircle2 size={16} />
              {passwordSuccess}
            </div>
          )}

          {passwordError && (
            <div className="alert-message alert-error">
              <AlertCircle size={16} />
              {passwordError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mot de passe actuel</label>
              <input
                type="password"
                className="form-control"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nouveau mot de passe (8 caractères min.)</label>
              <input
                type="password"
                className="form-control"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={passwordLoading}
              style={{ marginTop: '8px', alignSelf: 'flex-start' }}
            >
              <Lock size={16} />
              {passwordLoading ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
