import React, { useState, useEffect } from 'react';
import api, { authStorage } from '../utils/api';
import { decodeJwt } from '../utils/jwtHelper';
import { useToast } from '../components/Toast';
import CipherSandboxTab from '../components/CipherSandboxTab';

/**
 * Dashboard & Session Status Page
 * Displays authenticated agent state, JWT token inspector,
 * session verification with GET /api/auth/me, preview of contracts,
 * and the interactive Cipher Lab / Sandbox.
 */
export default function DashboardPreview({ user, onLogout, onOpenLab1 }) {
  const [profile, setProfile] = useState(user);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [lastVerifiedAt, setLastVerifiedAt] = useState(null);
  const [tokenClaims, setTokenClaims] = useState(null);
  const [dashboardTab, setDashboardTab] = useState('marketplace'); // 'marketplace' | 'sandbox'
  const toast = useToast();

  const token = authStorage.getToken();

  useEffect(() => {
    if (token) {
      const decoded = decodeJwt(token);
      setTokenClaims(decoded);
    }
  }, [token]);

  const verifySessionWithServer = async () => {
    setLoadingVerify(true);
    try {
      const response = await api.get('/api/auth/me');
      setProfile(response.data.user);
      authStorage.setUser(response.data.user);
      setLastVerifiedAt(new Date().toLocaleTimeString());
      toast.showSuccess(
        `Session verified with backend. Agent ID: #${response.data.user.id}`,
        'SECURITY TOKEN VALID'
      );
    } catch (err) {
      console.error('Session verification failed:', err);
      toast.showError(
        err.response?.data?.error || 'Failed to authenticate with /api/auth/me',
        'AUTH VERIFY FAILED'
      );
    } finally {
      setLoadingVerify(false);
    }
  };

  return (
    <main
      style={{
        flex: 1,
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        zIndex: 10,
      }}
    >
      {/* Welcome Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--accent-green)',
          boxShadow: '0 0 20px var(--accent-green-glow)',
          padding: '20px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--accent-cyan)',
              letterSpacing: '0.08em',
              marginBottom: '4px',
            }}
          >
            [STAGE 0 ACTIVE] // SYSTEM AUTHENTICATION VERIFIED
          </div>
          <h2
            style={{
              color: 'var(--accent-green)',
              fontSize: '1.4rem',
              margin: '0 0 6px 0',
            }}
          >
            WELCOME, AGENT {profile?.username || user?.username}
          </h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Authorization Level: <span style={{ color: 'var(--accent-cyan)' }}>{profile?.role || 'user'}</span> | 
            Database ID: <span style={{ color: 'var(--accent-cyan)' }}>#{profile?.id || user?.id}</span> | 
            TOR Node: <span style={{ color: 'var(--accent-green)' }}>tor-node-849.onion</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-cyber btn-cyber-cyan"
            onClick={verifySessionWithServer}
            disabled={loadingVerify}
            style={{ fontSize: '0.8rem' }}
          >
            {loadingVerify ? 'VERIFYING...' : '[TEST /API/AUTH/ME]'}
          </button>
          <button
            type="button"
            className="btn-cyber btn-cyber-danger"
            onClick={onLogout}
            style={{ fontSize: '0.8rem' }}
          >
            [TERMINATE SESSION]
          </button>
        </div>
      </div>

      {/* Dashboard Sub-navigation Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '8px',
        }}
      >
        <button
          type="button"
          className={`btn-cyber ${dashboardTab === 'marketplace' ? '' : 'btn-cyber-cyan'}`}
          onClick={() => setDashboardTab('marketplace')}
          style={{
            background: dashboardTab === 'marketplace' ? 'var(--accent-green)' : 'transparent',
            color: dashboardTab === 'marketplace' ? 'var(--bg-main)' : 'var(--accent-cyan)',
            borderColor: dashboardTab === 'marketplace' ? 'var(--accent-green)' : 'var(--border-color)',
            padding: '8px 18px',
            fontSize: '0.85rem',
          }}
        >
          [1. CONTRACTS &amp; VAULT]
        </button>
        <button
          type="button"
          className={`btn-cyber ${dashboardTab === 'sandbox' ? '' : 'btn-cyber-cyan'}`}
          onClick={() => setDashboardTab('sandbox')}
          style={{
            background: dashboardTab === 'sandbox' ? 'var(--accent-green)' : 'transparent',
            color: dashboardTab === 'sandbox' ? 'var(--bg-main)' : 'var(--accent-cyan)',
            borderColor: dashboardTab === 'sandbox' ? 'var(--accent-green)' : 'var(--border-color)',
            padding: '8px 18px',
            fontSize: '0.85rem',
          }}
        >
          [2. CIPHER LAB // SANDBOX]
        </button>
      </div>

      {dashboardTab === 'sandbox' ? (
        <CipherSandboxTab />
      ) : (
        <>
          {/* Grid: Token Inspector & Auth Status */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '20px',
            }}
          >
        {/* Token Info Card */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: '20px',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '10px',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)' }}>
              &gt; JWT TOKEN CLAIMS
            </h3>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent-green)',
                background: 'rgba(0, 255, 102, 0.1)',
                padding: '2px 6px',
              }}
            >
              SIGNED (HS256)
            </span>
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Header: <code style={{ color: 'var(--accent-red)' }}>&#123; "alg": "HS256", "typ": "JWT" &#125;</code>
          </div>

          <div
            style={{
              background: 'var(--bg-main)',
              border: '1px solid var(--border-color)',
              padding: '12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: 'var(--accent-purple)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: '140px',
              overflowY: 'auto',
            }}
          >
            {tokenClaims ? JSON.stringify(tokenClaims, null, 2) : 'No token payload decoded'}
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              borderTop: '1px dashed var(--border-color)',
              paddingTop: '8px',
            }}
          >
            Secret Key: <code style={{ color: 'var(--accent-amber)' }}>{profile?.jwt_secret || user?.jwt_secret || 'LastnameFirstname'}</code> (User-specific key)
          </div>
        </div>

        {/* Database & Protected API Verification */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: '20px',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '10px',
            }}
          >
            <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-green)' }}>
              &gt; SQLITE PERSISTENCE
            </h3>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent-green)',
                background: 'rgba(0, 255, 102, 0.1)',
                padding: '2px 6px',
              }}
            >
              SYNCHRONIZED
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Storage Location: </span>
              <code style={{ color: 'var(--text-code)' }}>backend/database.db</code>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Table: </span>
              <code style={{ color: 'var(--text-code)' }}>Users (id, username, password_hash, balance)</code>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Password Hash: </span>
              <code style={{ color: 'var(--accent-green)' }}>SHA-256 (Hex Digest)</code>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Last Server Ping: </span>
              <span style={{ color: 'var(--accent-cyan)' }}>
                {lastVerifiedAt ? `${lastVerifiedAt} (HTTP 200 OK)` : 'Awaiting manual trigger or auto-load'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Marketplace Preview (Stage 1-4) */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          padding: '20px',
          borderRadius: '4px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '8px',
          }}
        >
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>
            &gt; DARKWEB CONTRACTS ROADMAP (STAGE 1 - 4)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            4 AVAILABLE CONTRACTS
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
          }}
        >
          {/* Lab 1 */}
          <div
            style={{
              background: 'rgba(10, 13, 20, 0.75)',
              border: '1px solid var(--accent-cyan)',
              boxShadow: '0 0 12px var(--accent-cyan-glow)',
              padding: '16px',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  CONTRACT #1 [EASY]
                </span>
                <span
                  style={{
                    color: 'var(--accent-green)',
                    background: 'rgba(0, 255, 102, 0.1)',
                    border: '1px solid var(--accent-green)',
                    padding: '1px 6px',
                    fontSize: '0.65rem',
                  }}
                >
                  AVAILABLE
                </span>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '6px' }}>
                Frequency Analyzer
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                Caesar &amp; Transposition cipher cryptanalysis with real-time histograms for UA and EN languages.
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--accent-green)' }}>
                REWARD: <strong>$ 1,500 BTC</strong>
              </div>
            </div>

            <button
              type="button"
              className="btn-cyber btn-cyber-cyan"
              onClick={onOpenLab1}
              style={{ width: '100%', padding: '8px', fontSize: '0.78rem' }}
            >
              [OPEN CONTRACT #1 &gt;&gt;]
            </button>
          </div>

          {/* Lab 2 */}
          <div
            style={{
              background: 'rgba(10, 13, 20, 0.6)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              borderRadius: '2px',
            }}
          >
            <div style={{ color: 'var(--accent-purple)', fontSize: '0.75rem', marginBottom: '4px' }}>
              CONTRACT #2 [MEDIUM]
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '0.88rem', marginBottom: '6px' }}>
              JWT Vault Exploit
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Privilege escalation attack modifying payload claim to "role": "admin".
            </div>
          </div>

          {/* Lab 3 */}
          <div
            style={{
              background: 'rgba(10, 13, 20, 0.6)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              borderRadius: '2px',
            }}
          >
            <div style={{ color: 'var(--accent-amber)', fontSize: '0.75rem', marginBottom: '4px' }}>
              CONTRACT #3 [HARD]
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '0.88rem', marginBottom: '6px' }}>
              S-DES Feistel Inspector
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Step-by-step 8-bit block decryption, Feistel rounds, P10/P8 key expansion.
            </div>
          </div>

          {/* Lab 4 */}
          <div
            style={{
              background: 'rgba(10, 13, 20, 0.6)',
              border: '1px solid var(--border-color)',
              padding: '14px',
              borderRadius: '2px',
            }}
          >
            <div style={{ color: 'var(--accent-red)', fontSize: '0.75rem', marginBottom: '4px' }}>
              CONTRACT #4 [HARD]
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '0.88rem', marginBottom: '6px' }}>
              Diffie-Hellman MITM
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
              Interception and public key injection between Alice and Bob nodes.
            </div>
          </div>
          </div>
        </div>
      </>
    )}
  </main>
);
}
