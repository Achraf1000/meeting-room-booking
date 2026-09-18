import React from 'react';
import { Building2 } from 'lucide-react';
import './Logo.css';

export const Logo = ({
  size = 'md',
  showText = true,
  subtitle = '',
  className = '',
}) => {
  return (
    <div className={`logo-container logo-${size} ${className}`}>
      <div className="logo-image-wrapper">
        <Building2 className="logo-mark" aria-hidden="true" />
      </div>

      {showText && (
        <div className="logo-text-group">
          <span className="logo-title">Meeting Rooms</span>
          {subtitle && <span className="logo-subtitle">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
