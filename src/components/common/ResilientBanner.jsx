import React from 'react';
import { Radio } from 'lucide-react';

export default function ResilientBanner() {
  return (
    <div className="resilient-banner">
      <div className="resilient-icon-circle">
        <Radio size={18} />
      </div>
      <div>
        <div className="resilient-title">Mode Résilient</div>
        <div className="resilient-desc">
          Connexion lente... les disponibilités locales et officines de garde restent consultables hors-ligne.
        </div>
      </div>
    </div>
  );
}
