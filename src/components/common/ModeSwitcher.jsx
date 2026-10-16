import React from 'react';
import { User, Store, Columns, RotateCcw } from 'lucide-react';
import { DEMO_PHARMACIES_ACCOUNTS } from '../../services/authService';

export default function ModeSwitcher({
  role,
  onRoleChange,
  activePharmacyId,
  onPharmacyChange,
  pharmacies = [],
  isSplitView,
  onToggleSplitView,
  onResetDemo,
  pendingCount = 0
}) {
  return (
    <div className="pg-mode-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div className="pg-mode-pill-toggle">
          <button
            className={`pg-mode-pill-btn ${role === 'patient' && !isSplitView ? 'active' : ''}`}
            onClick={() => onRoleChange('patient')}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <User size={12} /> Patient
            </span>
          </button>
          <button
            className={`pg-mode-pill-btn ${role === 'pharmacist' && !isSplitView ? 'active' : ''}`}
            onClick={() => onRoleChange('pharmacist')}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Store size={12} /> Pharmacie {pendingCount > 0 && `(${pendingCount})`}
            </span>
          </button>
        </div>

        {role === 'pharmacist' && !isSplitView && (
          <select
            value={activePharmacyId}
            onChange={(e) => onPharmacyChange(e.target.value)}
            style={{
              background: '#113833',
              color: '#d6f6ee',
              border: '1px solid #1c4d46',
              borderRadius: '6px',
              padding: '3px 6px',
              fontSize: '11px',
              fontWeight: 600,
              maxWidth: '150px'
            }}
          >
            {(pharmacies && pharmacies.length > 0 ? pharmacies : DEMO_PHARMACIES_ACCOUNTS).map((item) => {
              const val = item.id || item.pharmacyId;
              const label = item.name || item.pharmacyName;
              return (
                <option key={val} value={val}>
                  {label}
                </option>
              );
            })}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={onToggleSplitView}
          title="Affichage côte-à-côte (Patient + Pharmacie)"
          style={{
            background: isSplitView ? 'var(--color-mint)' : '#113833',
            color: isSplitView ? 'var(--color-primary-dark)' : '#c7eae2',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Columns size={12} />
          <span className="split-view-text">{isSplitView ? 'Vue Simple' : 'Vue Duo'}</span>
        </button>

        <button
          onClick={onResetDemo}
          title="Réinitialiser les données de démo"
          style={{
            background: '#113833',
            color: '#a2cbc3',
            padding: '3px 6px',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center'
          }}
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
