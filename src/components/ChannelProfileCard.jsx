import React from 'react';

const YoutubeIcon = ({ size = 24, fill = "currentColor", style = {}, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    style={{ width: size, height: size, fill: fill, stroke: 'none', ...style }}
    {...props}
  >
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

export default function ChannelProfileCard({ channelName, channelId, avatar }) {
  return (
    <div 
      className="glass-panel"
      style={{
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        backgroundColor: 'rgba(15, 15, 24, 0.4)'
      }}
    >
      <div style={{ position: 'relative' }}>
        {avatar ? (
          <img 
            src={avatar} 
            alt={channelName} 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              border: '2px solid var(--accent-cyan)',
              objectFit: 'cover'
            }}
          />
        ) : (
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '2px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)'
            }}
          >
            <YoutubeIcon size={28} />
          </div>
        )}
        <div 
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            backgroundColor: '#ff0000',
            color: '#fff',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #08080c'
          }}
        >
          <YoutubeIcon size={12} fill="#fff" />
        </div>
      </div>

      <div style={{ flexGrow: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {channelName || "Connected Channel"}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
          ID: {channelId || "Not Available"}
        </p>
      </div>
    </div>
  );
}
