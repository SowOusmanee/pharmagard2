import React, { useState, useEffect } from 'react';
import { Pill, CheckCircle2, ShieldCheck, ArrowRight, Clock } from 'lucide-react';
import DotsLoader from '../common/DotsLoader';

export default function WaitingConfirmationScreen({
  medicines = [],
  onProceedToResults,
  onRetake
}) {
  const [confirmedCount, setConfirmedCount] = useState(1);
  const [statusMessage, setStatusMessage] = useState("Demande transmise aux officines à proximité...");

  useEffect(() => {
    // Dynamic simulation of pharmacies responding in real time
    const t1 = setTimeout(() => {
      setConfirmedCount(2);
      setStatusMessage("Pharmacie Keur Massar a confirmé la disponibilité...");
    }, 1100);

    const t2 = setTimeout(() => {
      setConfirmedCount(3);
      setStatusMessage("Pharmacie Al Amin Keur Massar vérifie ses rayons...");
    }, 2000);

    const t3 = setTimeout(() => {
      setConfirmedCount(4);
      setStatusMessage("Confirmations reçues ! Préparation des résultats...");
    }, 2900);

    // Auto-navigate to results once confirmed
    const tFinal = setTimeout(() => {
      onProceedToResults();
    }, 3600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(tFinal);
    };
  }, [onProceedToResults]);

  return (
    <div
      className="pg-content-scroll"
      style={{
        padding: '16px 20px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px'
      }}
    >
      {/* Title */}
      <div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--color-mint-light, #E6FAF5)',
            color: 'var(--color-primary-dark, #004740)',
            padding: '4px 10px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 800,
            marginBottom: '8px'
          }}
        >
          <ShieldCheck size={13} color="var(--color-accent-green, #15803D)" />
          <span>ORDONNANCE ANALYSÉE</span>
        </div>

        <h1
          style={{
            fontSize: '22px',
            fontWeight: 700,
            color: 'var(--color-primary-dark, #004740)',
            lineHeight: 1.25,
            margin: '0 0 4px'
          }}
        >
          Médicaments retenus
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted, #526E6A)', margin: 0 }}>
          Voici la liste extraite de votre prescription médicale :
        </p>
      </div>

      {/* List of extracted medicines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {medicines.map((med, index) => (
          <div
            key={med.id || index}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--color-border, #E5EBEA)',
              borderRadius: '12px',
              padding: '12px 14px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-mint-light, #E6FAF5)',
                  color: 'var(--color-primary, #005F56)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Pill size={17} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-main, #0B2421)' }}>
                  {med.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-muted, #526E6A)' }}>
                  {med.dosage || 'Dosage standard'}
                </div>
              </div>
            </div>

            <CheckCircle2 size={18} color="var(--color-accent-emerald, #10B981)" />
          </div>
        ))}
      </div>

      {/* En attente de confirmation des autres pharmaciens */}
      <div
        className="slow-connection-card"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1.5px solid var(--color-mint, #95ECD8)',
          boxShadow: '0 4px 15px rgba(0, 95, 86, 0.05)',
          padding: '20px 16px',
          marginTop: '6px'
        }}
      >
        <DotsLoader
          message="En attente de confirmation des pharmaciens"
          subtext={statusMessage}
        />

        {/* Real-time responses badge counter */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#F0FDF4',
            color: '#166534',
            border: '1px solid #BBF7D0',
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          <Clock size={13} />
          <span>{confirmedCount} officines ont confirmé le stock</span>
        </div>

        {/* Manual proceed button if user does not want to wait */}
        <button
          onClick={onProceedToResults}
          style={{
            marginTop: '8px',
            background: 'var(--color-primary, #005F56)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '999px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <span>Voir les résultats immédiatement</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
