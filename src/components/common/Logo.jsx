import React from 'react';

export default function Logo({ subtitle = 'Médicament', onClick }) {
  return (
    <div className="pg-logo-group" onClick={onClick}>
      <div className="pg-logo-icon">
        <div className="pg-logo-cross" />
        <div className="pg-logo-dot" />
      </div>
      <div className="pg-logo-titles">
        <span className="pg-logo-name">PharmaGarde</span>
        {subtitle && <span className="pg-logo-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
}
