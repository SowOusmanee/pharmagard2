import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, CheckCircle2, XCircle, Clock, Check, RefreshCw } from 'lucide-react';
import { db } from '../../services/db';

export default function MedicineStockScreen({ pharmacy }) {
  const [medicines, setMedicines] = useState([]);
  const [stock, setStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', dosage: '500 mg', availability: 'AVAILABLE' });

  const loadData = () => {
    if (!pharmacy) return;
    setMedicines(db.getMedicines());
    setStock(db.getPharmacyStock(pharmacy.id));
  };

  useEffect(() => {
    loadData();
    const unsub = db.subscribe((event) => {
      if (event.type === 'STOCK_UPDATED' || event.type === 'RESET') {
        loadData();
      }
    });
    return unsub;
  }, [pharmacy]);

  const handleToggleAvailability = (medicineId, currentAvailability) => {
    const next = currentAvailability === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    db.updateStockAvailability(pharmacy.id, medicineId, next);
    loadData();
  };

  const handleAddNewMedicine = (e) => {
    e.preventDefault();
    if (!newMed.name.trim()) return;

    // Add to medicines database if not present
    const existingMed = db.findMedicineByName(newMed.name);
    let medId = existingMed?.id;

    if (!existingMed) {
      medId = `med_${Date.now()}`;
      const allMeds = db.getMedicines();
      allMeds.push({
        id: medId,
        name: newMed.name.trim(),
        normalizedName: newMed.name.toLowerCase().trim(),
        dosage: newMed.dosage.trim(),
        category: 'Générique',
        active: true
      });
      localStorage.setItem('pharmagarde_medicines', JSON.stringify(allMeds));
    }

    db.updateStockAvailability(pharmacy.id, medId, newMed.availability);
    setNewMed({ name: '', dosage: '500 mg', availability: 'AVAILABLE' });
    setShowAddForm(false);
    loadData();
  };

  // Merge medicines with this pharmacy's stock info
  const displayItems = medicines.map((m) => {
    const stockRecord = stock.find((s) => s.medicineId === m.id);
    const availability = stockRecord ? stockRecord.availability : 'UNKNOWN';
    const lastUpdated = stockRecord?.lastUpdated;

    return {
      medicine: m,
      availability,
      lastUpdated
    };
  }).filter((item) => {
    if (!searchTerm) return true;
    return item.medicine.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="pg-content-scroll" style={{ paddingBottom: '30px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '22px', color: 'var(--color-primary)', lineHeight: '1.2' }}>
            Gestion du stock
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            Mise à jour rapide des molécules fréquentes
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Search Input */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          padding: '10px 14px',
          gap: '8px'
        }}
      >
        <Search size={18} color="#64748B" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filtrer un médicament..."
          style={{
            border: 'none',
            outline: 'none',
            width: '100%',
            fontSize: '14px',
            color: 'var(--color-text-main)'
          }}
        />
      </div>

      {/* Add Medication Form */}
      {showAddForm && (
        <form
          onSubmit={handleAddNewMedicine}
          className="pg-card"
          style={{ border: '2px solid var(--color-mint)' }}
        >
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-primary)' }}>
            Nouveau médicament en stock
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px' }}>
            <input
              type="text"
              required
              value={newMed.name}
              onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
              placeholder="Nom (ex: Cétirizine)"
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '13px'
              }}
            />
            <input
              type="text"
              value={newMed.dosage}
              onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
              placeholder="Dosage (ex: 10 mg)"
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
            <button type="submit" className="btn-primary" style={{ padding: '10px' }}>
              Enregistrer en stock
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowAddForm(false)}
              style={{ padding: '10px' }}
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Medicines Inventory List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {displayItems.map(({ medicine, availability, lastUpdated }) => {
          const isAvail = availability === 'AVAILABLE';
          const isUnavail = availability === 'UNAVAILABLE';
          const isUnknown = availability === 'UNKNOWN';

          const timeAgo = lastUpdated
            ? Math.floor((Date.now() - lastUpdated) / 60000)
            : null;

          return (
            <div
              key={medicine.id}
              className="pg-card"
              style={{
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-main)' }}>
                  {medicine.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                  {medicine.dosage} · {medicine.category || 'Générique'}
                </div>
                {lastUpdated && (
                  <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Clock size={11} />
                    <span>Mis à jour il y a {timeAgo < 1 ? "1 min" : `${timeAgo} min`}</span>
                  </div>
                )}
              </div>

              {/* One-tap availability switcher */}
              <button
                onClick={() => handleToggleAvailability(medicine.id, availability)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: isAvail ? '#D1FAE5' : isUnavail ? '#FEE2E2' : '#F1F5F9',
                  color: isAvail ? '#065F46' : isUnavail ? '#991B1B' : '#475569',
                  border: isAvail ? '1px solid #A7F3D0' : isUnavail ? '1px solid #FECACA' : '1px solid #CBD5E1'
                }}
              >
                {isAvail ? (
                  <>
                    <CheckCircle2 size={15} />
                    <span>Disponible</span>
                  </>
                ) : isUnavail ? (
                  <>
                    <XCircle size={15} />
                    <span>Rupture</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Non défini</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
