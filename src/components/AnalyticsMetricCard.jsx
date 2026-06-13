import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function AnalyticsMetricCard({ 
  title, 
  value, 
  changePercentage,
  icon: Icon
}) {
  const hasPercentage = changePercentage !== undefined && changePercentage !== null;
  const isPositive = hasPercentage 
    ? (typeof changePercentage === 'number' ? changePercentage >= 0 : !changePercentage.toString().startsWith('-')) 
    : true;
  
  const displayPercentage = hasPercentage 
    ? (typeof changePercentage === 'number' 
        ? `${isPositive ? '+' : ''}${changePercentage}%` 
        : changePercentage)
    : '';

  return (
    <div 
      className="glass-panel" 
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'rgba(15, 15, 24, 0.4)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
          {title}
        </span>
        {Icon && (
          <div style={{ color: 'var(--accent-cyan)', opacity: 0.8 }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-sans)', color: '#fff' }}>
          {value}
        </span>
        
        {hasPercentage && (
          <span 
            style={{ 
              fontSize: '0.8rem', 
              fontWeight: 600, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '2px',
              color: isPositive ? '#10b981' : '#ef4444' 
            }}
          >
            {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {displayPercentage}
          </span>
        )}
      </div>
    </div>
  );
}
