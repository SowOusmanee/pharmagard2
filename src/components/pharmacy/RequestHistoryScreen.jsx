import React, { useState, useEffect } from 'react';
import { History, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { db } from '../../services/db';

export default function RequestHistoryScreen({ pharmacy }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'available' | 'unavailable'
  const [requests, setRequests] = useState([]);

  const loadRequests = () => {
    if (!pharmacy) return;
    setRequests(db.getRequests(pharmacy.id));
  };

  useEffect(() => {
    loadRequests();
    const unsub = db.subscribe((event) => {
      if (event.type === 'REQUEST_RESPONDED' || event.type === 'REQUEST_CREATED' || event.type === 'RESET') {
        loadRequests();
      }
    });
    return unsub;
  }, [pharmacy]);

  const filtered = requests.filter((r) => {
    if (filter === 'available') return r.status === 'AVAILABLE';
    if (filter === 'unavailable') return r.status === 'UNAVAILABLE';
    return true;
  });

  return (
    <div className="pg-content-scroll" style={{ paddingBottom: '30px' }}>
      <div>
        <h1 style={{ fontSize: '22px', color: 'var(--color-primary)', lineHeight: '1.2' }}>
          Historique des demandes
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Demandes reçues aujourd'hui et réponses transmises
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          background: '#EAEFEF',
          padding: '4px',
          borderRadius: '12px'
        }}
      >
        <button
          onClick={() => setFilter('all')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            background: filter === 'all' ? '#FFFFFF' : 'transparent',
            color: filter === 'all' ? 'var(--color-primary-dark)' : '#64748B'
          }}
        >
          Toutes ({requests.length})
        </button>
        <button
          onClick={() => setFilter('available')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            background: filter === 'available' ? '#FFFFFF' : 'transparent',
            color: filter === 'available' ? '#065F46' : '#64748B'
          }}
        >
          Confirmées
        </button>
        <button
          onClick={() => setFilter('unavailable')}
          style={{
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 700,
            background: filter === 'unavailable' ? '#FFFFFF' : 'transparent',
            color: filter === 'unavailable' ? '#991B1B' : '#64748B'
          }}
        >
          Ruptures
        </button>
      </div>

      {/* Request list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 ? (
          <div className="pg-card" style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
            Aucune demande trouvée pour ce filtre.
          </div>
        ) : (
          filtered.map((req) => {
            const isAvail = req.status === 'AVAILABLE';
            const isUnavail = req.status === 'UNAVAILABLE';
            const isPending = req.status === 'PENDING';

            const timeStr = new Date(req.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={req.requestId}
                className="pg-card"
                style={{ padding: '12px 14px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-main)' }}>
                    {req.medicineName}
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '999px',
                      background: isAvail ? '#D1FAE5' : isUnavail ? '#FEE2E2' : '#FEF3C7',
                      color: isAvail ? '#065F46' : isUnavail ? '#991B1B' : '#92400E'
                    }}
                  >
                    {isAvail ? 'Disponible' : isUnavail ? 'Indisponible' : 'En attente'}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                  Dosage : {req.dosage} · Patient : {req.patientZone} ({req.patientDistance})
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#64748B',
                    borderTop: '1px solid #F1F5F5',
                    paddingTop: '6px',
                    marginTop: '6px'
                  }}
                >
                  <span>Reçu à {timeStr}</span>
                  <span>ID: {req.requestId.slice(-6)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
