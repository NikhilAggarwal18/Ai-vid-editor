import React from 'react';

export default function PrimaryButton({ 
  children, 
  onClick, 
  loading = false, 
  disabled = false, 
  style = {}, 
  className = "",
  ...props 
}) {
  return (
    <button
      onClick={!loading && !disabled ? onClick : undefined}
      disabled={disabled || loading}
      className={`neon-btn ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : (loading ? 'wait' : 'pointer'),
        position: 'relative',
        transition: 'all 0.3s ease',
        ...style
      }}
      {...props}
    >
      {loading && (
        <svg 
          style={{
            animation: 'spin 1s linear infinite',
            width: '18px',
            height: '18px',
            color: 'currentColor',
            marginRight: '2px'
          }} 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            style={{ opacity: 0.25 }} 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            style={{ opacity: 0.75 }} 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
}
