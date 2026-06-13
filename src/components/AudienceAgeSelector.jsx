import React from 'react';

const AGE_OPTIONS = [
  { label: 'Below 15', value: 'BELOW_15' },
  { label: '15 - 18', value: '15_18' },
  { label: '18 - 22', value: '18_22' },
  { label: '22 - 30', value: '22_30' },
  { label: '30 - 40', value: '30_40' },
  { label: '40+', value: '40_PLUS' }
];

export default function AudienceAgeSelector({ selectedAge, onChange }) {
  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '12px',
        width: '100%'
      }}
    >
      {AGE_OPTIONS.map((opt) => {
        const isSelected = selectedAge === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            style={{
              padding: '14px 20px',
              borderRadius: '8px',
              border: `1px solid ${isSelected ? 'var(--accent-cyan)' : 'var(--border-light)'}`,
              background: isSelected ? 'rgba(0, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              color: isSelected ? '#fff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.9rem',
              boxShadow: isSelected ? '0 0 10px rgba(0, 255, 255, 0.15)' : 'none',
              transition: 'all 0.2s ease-in-out',
              textAlign: 'center'
            }}
            onClick={() => onChange(opt.value)}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'var(--border-light)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
