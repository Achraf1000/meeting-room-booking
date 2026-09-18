import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

export const StatusBadge = ({ status }) => {
  const config = {
    pending: {
      label: 'En attente',
      icon: Clock,
      style: {
        background: 'var(--status-pending-bg)',
        color: 'var(--status-pending-text)',
        border: '1px solid var(--status-pending-border)',
      },
    },
    approved: {
      label: 'Approuvée',
      icon: CheckCircle2,
      style: {
        background: 'var(--status-approved-bg)',
        color: 'var(--status-approved-text)',
        border: '1px solid var(--status-approved-border)',
      },
    },
    rejected: {
      label: 'Rejetée',
      icon: XCircle,
      style: {
        background: 'var(--status-rejected-bg)',
        color: 'var(--status-rejected-text)',
        border: '1px solid var(--status-rejected-border)',
      },
    },
  };

  const current = config[status] || config.pending;
  const Icon = current.icon;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.8rem',
        fontWeight: '600',
        lineHeight: 1,
        ...current.style,
      }}
    >
      <Icon size={14} />
      {current.label}
    </span>
  );
};
