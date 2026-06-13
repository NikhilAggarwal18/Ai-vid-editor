import React from 'react';

export default function CreatorSelectionCard({ 
  title, 
  description, 
  icon: Icon, 
  ctaText, 
  onClick 
}) {
  return (
    <div 
      className="glass-panel" 
      style={{
        padding: '36px',
        flex: '1',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '20px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        backgroundColor: 'rgba(15, 15, 24, 0.4)'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = 'var(--accent-cyan)';
        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 255, 255, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-light)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div 
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          border: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-cyan)'
        }}
      >
        {Icon && <Icon size={32} />}
      </div>
      
      <div style={{ flexGrow: 1 }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
          {description}
        </p>
      </div>

      <button 
        className="neon-btn"
        style={{
          marginTop: '12px',
          padding: '10px 24px',
          fontSize: '0.9rem',
          pointerEvents: 'none' /* Let card click trigger it naturally */
        }}
      >
        {ctaText}
      </button>
    </div>
  );
}
