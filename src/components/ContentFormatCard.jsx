import React from 'react';

export default function ContentFormatCard({ 
  title, 
  description, 
  selected, 
  onSelect 
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        padding: '24px',
        borderRadius: '12px',
        border: `1px solid ${selected ? 'var(--accent-cyan)' : 'var(--border-light)'}`,
        background: selected ? 'rgba(0, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.02)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        transition: 'all 0.25s ease',
        boxShadow: selected ? '0 0 15px rgba(0, 255, 255, 0.1)' : 'none',
        flex: 1,
        minWidth: '200px'
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = 'var(--border-light)';
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: selected ? '#fff' : 'var(--text-primary)' }}>
          {title}
        </h4>
        <div 
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            border: `2px solid ${selected ? 'var(--accent-cyan)' : 'var(--border-light)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? 'var(--accent-cyan)' : 'transparent',
            transition: 'all 0.2s'
          }}
        >
          {selected && (
            <div 
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#000'
              }}
            />
          )}
        </div>
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4' }}>
        {description}
      </p>
    </div>
  );
}
