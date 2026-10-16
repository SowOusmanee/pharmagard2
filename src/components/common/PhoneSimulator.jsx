import React from 'react';

export default function PhoneSimulator({ children, isSplitView = false }) {
  return (
    <div className={`phone-mockup-wrapper ${isSplitView ? 'split-screen' : ''}`}>
      {/* Screen Frame */}
      <div className="phone-screen-inner">
        {/* Content of the application */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
