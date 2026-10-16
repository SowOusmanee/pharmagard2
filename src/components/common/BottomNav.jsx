import React from 'react';
import { Home, ShieldPlus, Inbox, PackageCheck, History } from 'lucide-react';

export default function BottomNav({ role, activeTab, onSelectTab, pendingRequestsCount = 0 }) {
  if (role === 'pharmacist') {
    return (
      <nav className="pg-bottom-nav">
        <button
          className={`pg-nav-item ${activeTab === 'pharmacy-home' ? 'active' : ''}`}
          onClick={() => onSelectTab('pharmacy-home')}
        >
          <div style={{ position: 'relative' }}>
            <Inbox size={20} />
            {pendingRequestsCount > 0 && (
              <span className="pg-nav-badge">{pendingRequestsCount}</span>
            )}
          </div>
          <span>Demandes</span>
        </button>

        <button
          className={`pg-nav-item ${activeTab === 'pharmacy-stock' ? 'active' : ''}`}
          onClick={() => onSelectTab('pharmacy-stock')}
        >
          <PackageCheck size={20} />
          <span>Stock</span>
        </button>

        <button
          className={`pg-nav-item ${activeTab === 'pharmacy-history' ? 'active' : ''}`}
          onClick={() => onSelectTab('pharmacy-history')}
        >
          <History size={20} />
          <span>Historique</span>
        </button>
      </nav>
    );
  }

  // Patient Navigation: Accueil & Garde
  return (
    <nav className="pg-bottom-nav">
      <button
        className={`pg-nav-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => onSelectTab('home')}
      >
        <Home size={20} />
        <span>Accueil</span>
      </button>

      <button
        className={`pg-nav-item ${activeTab === 'duty' ? 'active' : ''}`}
        onClick={() => onSelectTab('duty')}
      >
        <ShieldPlus size={20} />
        <span>Garde</span>
      </button>
    </nav>
  );
}
