import React from 'react';

/**
 * Top Navigation Bar (Section 5.1 of HackNet Design Specification)
 * Displays HackNet OS branding, agent identity, balance, TOR network status, and logout control.
 */
export default function Header({ user, onLogout, onNavigateHome, currentPage }) {
  const balanceFormatted = Number(user?.balance || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <header
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--accent-green)',
        boxShadow: '0 2px 14px var(--accent-green-glow)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        zIndex: 100,
        position: 'relative',
      }}
    >
      {/* OS Branding / Logo */}
      <div
        onClick={user && onNavigateHome ? onNavigateHome : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: user && onNavigateHome ? 'pointer' : 'default',
        }}
        title={user ? 'Return to Dashboard' : undefined}
      >
        <span className="pulse-indicator" title="TOR Network Node Active" />
        <span
          style={{
            fontFamily: 'var(--font-header)',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            letterSpacing: '0.08em',
            color: 'var(--accent-green)',
            textShadow: '0 0 10px var(--accent-green-glow)',
          }}
        >
          [HackNet OS v1.0]
        </span>
        <span
          style={{
            background: 'rgba(0, 240, 255, 0.1)',
            border: '1px solid var(--accent-cyan)',
            color: 'var(--accent-cyan)',
            padding: '2px 8px',
            fontSize: '0.7rem',
            borderRadius: '2px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          DARKWEB RELAY
        </span>
      </div>

      {/* Network and Stats */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        {/* Network Status */}
        <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ color: 'var(--text-muted)' }}>NET:</span>
          <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
            CONNECTED [TOR NODE #849]
          </span>
        </div>

        {/* User Balance */}
        {user && (
          <div
            style={{
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 170, 0, 0.1)',
              border: '1px solid var(--accent-amber)',
              padding: '4px 10px',
              borderRadius: '2px',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>VAULT:</span>
            <span
              style={{
                color: 'var(--accent-amber)',
                fontWeight: 'bold',
                textShadow: '0 0 6px var(--accent-amber-glow)',
              }}
            >
              $ {balanceFormatted} BTC
            </span>
          </div>
        )}

        {/* Profile & Avatar */}
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  background: 'var(--bg-main)',
                  border: '1px solid var(--accent-green)',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-green)',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 'bold',
                }}
                title={`Agent ID: #${user.id} | Role: ${user.role || 'user'}`}
              >
                &gt;_
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    letterSpacing: '0.04em',
                  }}
                >
                  AGENT://{user.username}
                </span>
                <span
                  style={{
                    color: user.role === 'admin' ? 'var(--accent-red)' : 'var(--text-muted)',
                    fontSize: '0.68rem',
                    textTransform: 'uppercase',
                  }}
                >
                  SEC-LEVEL: {user.role || 'USER'}
                </span>
              </div>
            </div>

            {/* Logout button */}
            <button
              type="button"
              className="btn-cyber btn-cyber-danger"
              onClick={onLogout}
              style={{ padding: '6px 14px', fontSize: '0.78rem' }}
              title="Terminate encrypted session"
            >
              [LOGOUT / DISCONNECT]
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
            [AWAITING AUTHENTICATION]
          </div>
        )}
      </div>
    </header>
  );
}
