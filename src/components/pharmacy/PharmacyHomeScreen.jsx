import React, { useState, useEffect } from 'react';
import { Store, Inbox, CheckCircle2, AlertCircle, PlusCircle, Bell, ArrowRight, LogOut } from 'lucide-react';
import AvailabilityRequestCard from './AvailabilityRequestCard';
import { db, SAMPLE_PRESCRIPTION_PHOTO } from '../../services/db';
import { notificationService } from '../../services/notificationService';

export default function PharmacyHomeScreen({ pharmacy, onNavigateToStock, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [hidingGroupIds, setHidingGroupIds] = useState(new Set());

  const loadRequests = () => {
    if (!pharmacy) return;
    const reqs = db.getRequests(pharmacy.id);
    setRequests(reqs);
  };

  useEffect(() => {
    loadRequests();
    const unsubscribe = db.subscribe((event) => {
      if (
        event.type === 'REQUEST_CREATED' ||
        event.type === 'REQUEST_RESPONDED' ||
        event.type === 'REQUEST_SERVED' ||
        event.type === 'READING_VERIFIED' ||
        event.type === 'RESET'
      ) {
        loadRequests();
      }
    });
    return unsubscribe;
  }, [pharmacy]);

  const handleRespond = (requestId, status) => {
    db.respondToRequest(requestId, status);

    const currentReqs = db.getRequests(pharmacy?.id);
    const updatedGroups = groupRequests(currentReqs);
    const affectedGroup = updatedGroups.find((g) => g.items.some((it) => it.requestId === requestId));

    if (affectedGroup && affectedGroup.items.every((it) => it.status !== 'PENDING')) {
      // Dès que la confirmation est complète pour cette ordonnance, elle disparaît
      setHidingGroupIds((prev) => new Set([...prev, affectedGroup.groupId]));
      setTimeout(() => {
        loadRequests();
        setHidingGroupIds((prev) => {
          const next = new Set(prev);
          next.delete(affectedGroup.groupId);
          return next;
        });
      }, 380);
    } else {
      loadRequests();
    }
  };

  const handleSimulateNewRequest = () => {
    const medNames = [
      { name: 'Amoxicilline', dosage: '1 g' },
      { name: 'Ibuprofène', dosage: '400 mg' },
      { name: 'Ciprofloxacine', dosage: '500 mg' },
      { name: 'Paracétamol', dosage: '1 g' }
    ];
    const pick = medNames[Math.floor(Math.random() * medNames.length)];

    const newReq = db.createAvailabilityRequest({
      pharmacyId: pharmacy.id,
      medicineName: pick.name,
      dosage: pick.dosage,
      patientZone: 'Keur Massar (Rond-point)',
      patientDistance: '0,5 km',
      prescriptionPhoto: SAMPLE_PRESCRIPTION_PHOTO
    });

    notificationService.sendPharmacyNotification(pharmacy.id, newReq);
    loadRequests();
  };

  const groupRequests = (list) => {
    const groupsMap = new Map();
    list.forEach((req) => {
      const key = req.prescriptionId || req.requestId;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          groupId: key,
          prescriptionId: req.prescriptionId,
          createdAt: req.createdAt,
          expiresAt: req.expiresAt,
          prescriptionPhoto: req.prescriptionPhoto,
          patientZone: req.patientZone,
          patientDistance: req.patientDistance,
          items: []
        });
      }
      const group = groupsMap.get(key);
      const alreadyExists = group.items.some(
        (it) => (it.medicineName || '').toLowerCase().trim() === (req.medicineName || '').toLowerCase().trim()
      );
      if (!alreadyExists) {
        group.items.push(req);
      }
    });
    return Array.from(groupsMap.values());
  };

  const allGroups = groupRequests(requests);
  const pendingGroups = allGroups.filter((g) => g.items.some((it) => it.status === 'PENDING'));
  const answeredGroups = allGroups.filter((g) => g.items.every((it) => it.status !== 'PENDING'));

  return (
    <div
      className="pg-content-scroll"
      style={{
        padding: '16px 14px 30px',
        background: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      {/* Pharmacy Header Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #005F56 0%, #003B35 100%)',
          color: '#FFFFFF',
          borderRadius: '18px',
          padding: '16px',
          boxShadow: '0 4px 14px rgba(0, 59, 53, 0.2)'
        }}
      >
        {/* Top Status Bar of Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: 'var(--color-mint)',
                color: 'var(--color-primary-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Store size={14} />
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-mint)', fontWeight: 800, letterSpacing: '0.5px' }}>
              SESSION OFFICINE
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: 'rgba(16, 185, 129, 0.22)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                color: '#A7F3D0',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', display: 'inline-block' }}></span>
              EN LIGNE
            </span>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                style={{
                  background: 'rgba(255, 255, 255, 0.16)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFFFFF',
                  borderRadius: '999px',
                  padding: '3px 10px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Quitter la session officine"
              >
                <LogOut size={11} /> Déconnexion
              </button>
            )}
          </div>
        </div>

        {/* Pharmacy Name */}
        <h2 style={{ fontSize: '18px', color: '#FFFFFF', fontWeight: 800, margin: '0 0 6px 0', lineHeight: '1.25' }}>
          {pharmacy?.name || 'Pharmacie Keur Massar'}
        </h2>

        {/* Info footer */}
        <div style={{ fontSize: '11.5px', color: '#D1FAE5', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          <span>📍 {pharmacy?.address || 'Keur Massar'}</span>
          <span>·</span>
          <span>Pharmacien : {pharmacy?.pharmacistName || 'Dr. Ousmane Diop'}</span>
        </div>
      </div>

      {/* Demandes en attente Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
        <h1 style={{ fontSize: '20px', color: 'var(--color-primary)', fontWeight: 800, margin: 0 }}>
          Demandes en attente
        </h1>

        <span
          style={{
            background: pendingGroups.length > 0 ? '#EF4444' : '#F1F5F9',
            color: pendingGroups.length > 0 ? '#FFFFFF' : '#64748B',
            fontSize: '12px',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '999px',
            border: pendingGroups.length > 0 ? 'none' : '1px solid #E2E8F0'
          }}
        >
          {pendingGroups.length} {pendingGroups.length > 1 ? 'demandes' : 'demande'}
        </span>
      </div>

      {/* Pending Requests List */}
      {pendingGroups.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            textAlign: 'center',
            padding: '24px 18px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#ECFDF5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '2px'
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
            Toutes les demandes sont traitées
          </div>
          <div style={{ fontSize: '12px', color: '#64748B', maxWidth: '270px', lineHeight: '1.4' }}>
            Vous serez notifié dès qu'un patient recherche un médicament non répertorié dans votre secteur.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingGroups.map((grp) => (
            <AvailabilityRequestCard
              key={grp.groupId}
              group={grp}
              isHiding={hidingGroupIds.has(grp.groupId)}
              onRespond={handleRespond}
            />
          ))}
        </div>
      )}

      {/* Demo helper action: trigger a simulated incoming request */}
      <div
        style={{
          background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
          border: '1px solid #BAE6FD',
          borderRadius: '16px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>⚡</span> Tester la notification
          </div>
          <div style={{ fontSize: '11px', color: '#0284C7', marginTop: '2px', lineHeight: '1.3' }}>
            Simuler une recherche patient
          </div>
        </div>

        <button
          onClick={handleSimulateNewRequest}
          style={{
            background: '#0284C7',
            color: '#FFFFFF',
            padding: '7px 12px',
            borderRadius: '9px',
            fontSize: '11.5px',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(2, 132, 199, 0.2)'
          }}
        >
          + Nouvelle demande
        </button>
      </div>
    </div>
  );
}
