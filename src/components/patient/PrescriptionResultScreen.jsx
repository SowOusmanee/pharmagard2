import React, { useState } from 'react';
import {
  Pill,
  Trash2,
  Edit2,
  Plus,
  AlertTriangle,
  ShieldCheck,
  Clock,
  ArrowRight,
  Check,
  Search
} from 'lucide-react';

export default function PrescriptionResultScreen({
  analysisData,
  onConfirmMedicines,
  onRetakePhoto
}) {
  const [medicines, setMedicines] = useState(analysisData?.medicines || []);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', dosage: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '' });

  const hasLowConfidence = medicines.some((m) => m.confidence && m.confidence < 0.7);

  const handleDelete = (id) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  const handleStartEdit = (med) => {
    setEditingId(med.id);
    setEditForm({ name: med.name, dosage: med.dosage });
  };

  const handleSaveEdit = (id) => {
    setMedicines(
      medicines.map((m) =>
        m.id === id ? { ...m, name: editForm.name, dosage: editForm.dosage, isVerified: true } : m
      )
    );
    setEditingId(null);
  };

  const handleAddMedicine = (e) => {
    e.preventDefault();
    if (!newMed.name.trim()) return;
    setMedicines([
      ...medicines,
      {
        id: `med_manual_${Date.now()}`,
        name: newMed.name.trim(),
        dosage: newMed.dosage.trim() || 'Standard',
        confidence: 1.0,
        isVerified: true
      }
    ]);
    setNewMed({ name: '', dosage: '' });
    setShowAddModal(false);
  };

  return (
    <div className="pg-content-scroll" style={{ paddingBottom: '30px' }}>
      {/* Header */}
      <div>
        <span
          style={{
            background: 'var(--color-mint-light)',
            color: 'var(--color-primary-dark)',
            fontSize: '11px',
            fontWeight: 800,
            padding: '4px 10px',
            borderRadius: '999px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <ShieldCheck size={13} color="var(--color-accent-green)" />
          ORDONNANCE NUMÉRISÉE
        </span>

        <h1
          style={{
            fontSize: '24px',
            color: 'var(--color-primary)',
            lineHeight: '1.2',
            marginTop: '8px'
          }}
        >
          Médicaments détectés
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
          Vérifiez la liste extraite avant de lancer la recherche de disponibilité.
        </p>
      </div>

      {/* Low confidence warning banner if applicable */}
      {hasLowConfidence && (
        <div
          style={{
            background: '#FEF3C7',
            border: '1px solid #F59E0B',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <AlertTriangle size={20} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#92400E' }}>
              Certains médicaments n'ont pas été lus avec certitude
            </div>
            <div style={{ fontSize: '12px', color: '#B45309', marginTop: '2px' }}>
              Veuillez vérifier ou corriger manuellement les lignes signalées ci-dessous.
            </div>
          </div>
        </div>
      )}

      {/* Extracted medicines list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {medicines.map((med, idx) => {
          const isLowConf = med.confidence && med.confidence < 0.7;
          const isEditing = editingId === med.id;

          if (isEditing) {
            return (
              <div
                key={med.id}
                className="pg-card"
                style={{ border: '2px solid var(--color-primary)', padding: '14px' }}
              >
                <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '8px' }}>
                  Modifier le médicament {idx + 1}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Nom du médicament"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontSize: '14px'
                    }}
                  />
                  <input
                    type="text"
                    value={editForm.dosage}
                    onChange={(e) => setEditForm({ ...editForm, dosage: e.target.value })}
                    placeholder="Dosage (ex: 500 mg)"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      className="btn-call"
                      onClick={() => handleSaveEdit(med.id)}
                      style={{ padding: '8px' }}
                    >
                      <Check size={15} /> Confirmer
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={() => setEditingId(null)}
                      style={{ padding: '8px 12px' }}
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div
              key={med.id}
              className="pg-card"
              style={{
                borderColor: isLowConf ? '#F59E0B' : 'var(--color-border)',
                background: isLowConf ? '#FFFBEB' : '#FFFFFF',
                padding: '14px 16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: isLowConf ? '#FEF3C7' : 'var(--color-mint-light)',
                      color: isLowConf ? '#D97706' : 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Pill size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-main)' }}>
                      {med.name}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                      {med.dosage || 'Dosage non précisé'}
                    </div>
                  </div>
                </div>

                {/* Confidence indicator badge */}
                {med.confidence && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: isLowConf ? '#FDE68A' : '#D1FAE5',
                      color: isLowConf ? '#92400E' : '#065F46'
                    }}
                  >
                    {isLowConf ? 'À vérifier' : `${Math.round(med.confidence * 100)}% certitude`}
                  </span>
                )}
              </div>

              {/* Edit / Delete actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  paddingTop: '8px',
                  marginTop: '4px'
                }}
              >
                <button
                  onClick={() => handleStartEdit(med)}
                  style={{
                    background: 'transparent',
                    color: 'var(--color-primary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px'
                  }}
                >
                  <Edit2 size={13} />
                  <span>Modifier</span>
                </button>

                <button
                  onClick={() => handleDelete(med.id)}
                  style={{
                    background: 'transparent',
                    color: '#EF4444',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px'
                  }}
                >
                  <Trash2 size={13} />
                  <span>Supprimer</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add another medicine button */}
      <button
        onClick={() => setShowAddModal(true)}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: '14px',
          border: '1.5px dashed var(--color-primary-light)',
          background: 'rgba(0, 95, 86, 0.04)',
          color: 'var(--color-primary)',
          fontSize: '14px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <Plus size={16} />
        <span>Ajouter un médicament manquant</span>
      </button>

      {/* Temporary Image Storage & Privacy Notice from Section 7 */}
      <div
        style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#166534'
        }}
      >
        <Clock size={16} style={{ flexShrink: 0 }} />
        <span>
          <strong>Confidentialité médicale :</strong> L'image de l'ordonnance est temporaire et sera détruite automatiquement après environ 10 minutes.
        </span>
      </div>

      {/* Medical Ethics Disclaimer (Mandatory) */}
      <div
        style={{
          fontSize: '11px',
          color: 'var(--color-text-muted)',
          lineHeight: '1.4',
          textAlign: 'center',
          padding: '0 8px'
        }}
      >
        La numérisation extrait uniquement les informations textuelles de l'ordonnance. Le service ne prescrit aucun médicament, ne modifie aucun traitement et ne recommande aucun substitut.
      </div>

      {/* Primary Action Button */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
        <button
          className="btn-primary"
          onClick={() => onConfirmMedicines(medicines)}
          disabled={medicines.length === 0}
        >
          <Search size={18} />
          <span>Rechercher les pharmacies ({medicines.length})</span>
        </button>

        <button
          onClick={onRetakePhoto}
          style={{
            background: 'transparent',
            color: 'var(--color-text-muted)',
            fontSize: '13px',
            fontWeight: 700,
            padding: '8px',
            textAlign: 'center'
          }}
        >
          Reprendre la photo
        </button>
      </div>

      {/* Add Medicine Modal Sheet */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-primary)', marginBottom: '12px' }}>
              Ajouter un médicament
            </h3>
            <form onSubmit={handleAddMedicine} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  Nom de la molécule ou spécialité
                </label>
                <input
                  type="text"
                  required
                  value={newMed.name}
                  onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  placeholder="ex: Amoxicilline"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                  Dosage
                </label>
                <input
                  type="text"
                  value={newMed.dosage}
                  onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                  placeholder="ex: 500 mg ou 1 g"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    fontSize: '14px',
                    marginTop: '4px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1.5 }}>
                  Ajouter
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1 }}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
