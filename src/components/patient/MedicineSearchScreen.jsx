import React, { useState, useMemo } from 'react';
import { Search, ArrowUpRight, X, Sparkles } from 'lucide-react';
import ResilientBanner from '../common/ResilientBanner';
import { searchMedicinesFast } from '../../services/medicineSearchService';

export default function MedicineSearchScreen({ onSearchSubmit, onSelectQuickMedicine }) {
  const [searchTerm, setSearchTerm] = useState('');

  const quickMedicines = [
    { name: 'Paracétamol', dosage: '1 g' },
    { name: 'Amoxicilline', dosage: '500 mg' },
    { name: 'Ibuprofène', dosage: '400 mg' },
    { name: 'Sérum oral (SRO)', dosage: 'Sachet 1L' },
    { name: 'Métronidazole', dosage: '500 mg' },
    { name: 'Artéméther', dosage: '80 mg' }
  ];

  // Instant fast search matching the user's keystrokes
  const suggestions = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 2) return [];
    return searchMedicinesFast(searchTerm.trim(), 5);
  }, [searchTerm]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    onSearchSubmit(searchTerm.trim());
  };

  const handleChipClick = (med) => {
    setSearchTerm(med.name);
    if (onSelectQuickMedicine) {
      onSelectQuickMedicine(med);
    }
  };

  const handleSelectSuggestion = (item) => {
    setSearchTerm(item.name);
    if (onSelectQuickMedicine) {
      onSelectQuickMedicine({
        name: item.name,
        dosage: item.dosage,
        form: item.form
      });
    } else {
      onSearchSubmit(item.name);
    }
  };

  return (
    <div className="pg-content-scroll">
      {/* Title & Subtitle from Screenshot 1 */}
      <div>
        <h1 style={{ fontSize: '26px', color: 'var(--color-primary)', lineHeight: '1.2' }}>
          Rechercher un médicament
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Consultez la disponibilité immédiate en pharmacie
        </p>
      </div>

      {/* Search Input Box */}
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--color-bg-input)',
            borderRadius: '16px',
            border: '1.5px solid #C2EBE2',
            padding: '12px 16px',
            gap: '10px'
          }}
        >
          <Search size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nom du médicament (ex: Amoxicilline)"
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '15px',
              width: '100%',
              color: 'var(--color-text-main)',
              fontWeight: 500
            }}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              style={{ background: 'transparent', color: '#64748B' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Instant Suggestions Dropdown matching the existing styling */}
        {suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '6px',
              background: '#FFFFFF',
              borderRadius: '14px',
              border: '1.5px solid #C2EBE2',
              boxShadow: '0 8px 24px rgba(13, 148, 136, 0.12)',
              zIndex: 50,
              overflow: 'hidden'
            }}
          >
            {suggestions.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #F1F5F9',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                    {item.dosage} {item.form ? `• ${item.form}` : ''}
                  </div>
                </div>
                <ArrowUpRight size={15} color="var(--color-primary)" />
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Médicaments fréquents (ACCÈS DIRECT) from Screenshot 1 */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '4px'
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-main)' }}>
            Médicaments fréquents
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              color: 'var(--color-primary)',
              letterSpacing: '0.04em'
            }}
          >
            ACCÈS DIRECT
          </span>
        </div>

        <div className="quick-chip-grid">
          {quickMedicines.map((med, idx) => (
            <button
              key={idx}
              className="quick-chip"
              onClick={() => handleChipClick(med)}
            >
              <span>{med.name}</span>
              <ArrowUpRight size={16} color="var(--color-primary)" />
            </button>
          ))}
        </div>
      </div>

      {/* Large Primary Search CTA from Screenshot 1 */}
      <button
        className="btn-primary"
        onClick={() => {
          if (searchTerm.trim()) {
            onSearchSubmit(searchTerm.trim());
          } else {
            // Default to Amoxicilline demo from screenshot 4
            onSelectQuickMedicine(quickMedicines[1]);
          }
        }}
        style={{ marginTop: '8px' }}
      >
        <Search size={18} />
        <span>Rechercher</span>
      </button>

      {/* MODE RÉSILIENT Banner from Screenshot 1 */}
      <div style={{ marginTop: '6px' }}>
        <ResilientBanner />
      </div>
    </div>
  );
}
