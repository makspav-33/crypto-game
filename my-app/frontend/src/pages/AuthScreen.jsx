import React, { useState } from 'react';
import api, { authStorage } from '../utils/api';
import { useToast } from '../components/Toast';
import TypingText from '../components/TypingText';

/**
 * Authentication Screen (Section 5.2 of HackNet Design Specification)
 * Centered terminal window featuring [LOGIN] and [REGISTER] tabs,
 * cyberpunk typing intro, green carets, and reactive feedback.
 */
export default function AuthScreen({ onAuthSuccess }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const toast = useToast();

  const handleTabChange = (tab) => {
    if (isLoading) return;
    setActiveTab(tab);
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      toast.showError('Agent Codename and Security Key are mandatory', 'CREDENTIALS MISSING');
      return;
    }

    if (activeTab === 'register') {
      if (cleanUsername.length < 3) {
        toast.showError('Codename must contain at least 3 characters', 'VALIDATION ERROR');
        return;
      }
      if (cleanPassword.length < 4) {
        toast.showError('Passphrase must contain at least 4 characters', 'VALIDATION ERROR');
        return;
      }
      if (cleanPassword !== confirmPassword.trim()) {
        toast.showError('Security keys do not match. Integrity compromised.', 'KEY MISMATCH');
        return;
      }
    }

    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        const response = await api.post('/api/auth/login', {
          username: cleanUsername,
          password: cleanPassword,
        });

        const { token, user, message } = response.data;
        authStorage.setToken(token);
        authStorage.setUser(user);
        toast.showSuccess(message || `Access granted for Agent ${cleanUsername}`, 'SECURITY CLEARANCE ACCEPTED');
        
        if (onAuthSuccess) {
          onAuthSuccess(user, token);
        }
      } else {
        // Register flow
        const response = await api.post('/api/auth/register', {
          username: cleanUsername,
          password: cleanPassword,
        });

        const { token, user, message } = response.data;
        authStorage.setToken(token);
        authStorage.setUser(user);
        toast.showSuccess(message || `Agent ${cleanUsername} registered successfully into HackNet OS`, 'RECORD INITIALIZED');

        if (onAuthSuccess) {
          onAuthSuccess(user, token);
        }
      }
    } catch (err) {
      console.error('Authentication error:', err);
      const serverError = err.response?.data?.error;
      const errorCode = err.response?.data?.code || 'AUTH_FAILURE';
      const fallbackMsg = activeTab === 'login'
        ? 'Invalid agent credentials or network unreachable.'
        : 'Failed to create agent record in dark web database.';
      
      toast.showError(serverError || fallbackMsg, errorCode);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Terminal Window Box */}
      <div
        style={{
          width: '100%',
          maxWidth: '540px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 0 25px rgba(0, 0, 0, 0.8), 0 0 15px rgba(0, 255, 102, 0.1)',
          borderRadius: '4px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Terminal Header Bar */}
        <div
          style={{
            background: 'var(--bg-main)',
            borderBottom: '1px solid var(--border-color)',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>●</span>
            <span style={{ color: 'var(--accent-amber)', fontSize: '0.8rem' }}>●</span>
            <span style={{ color: 'var(--accent-green)', fontSize: '0.8rem' }}>●</span>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                marginLeft: '8px',
              }}
            >
              TERM://AUTH_SUBSYSTEM.BIN
            </span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-header)',
              fontSize: '0.72rem',
              color: 'var(--accent-cyan)',
              letterSpacing: '0.05em',
            }}
          >
            SHA256:ENCRYPTED
          </div>
        </div>

        {/* Terminal Console Output & Welcome */}
        <div
          style={{
            padding: '20px 24px 14px 24px',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(10, 13, 20, 0.65)',
            fontSize: '0.82rem',
            lineHeight: '1.6',
            color: 'var(--text-code)',
          }}
        >
          <div style={{ color: 'var(--text-muted)', marginBottom: '4px', fontSize: '0.75rem' }}>
            [HACKNET OS v1.0 // SECURITY GATEWAY]
          </div>
          <TypingText
            text="TOR PROXY CONNECTED. Establishing SHA-256 encrypted tunnel... Ready for agent credentials."
            speed={22}
          />
        </div>

        {/* Navigation Tabs [LOGIN] / [REGISTER] */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(18, 24, 36, 0.8)',
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange('login')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === 'login' ? 'rgba(0, 255, 102, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'login' ? '2px solid var(--accent-green)' : '2px solid transparent',
              color: activeTab === 'login' ? 'var(--accent-green)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              fontSize: '0.88rem',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              textShadow: activeTab === 'login' ? '0 0 8px var(--accent-green-glow)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            [LOGIN]
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('register')}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: activeTab === 'register' ? 'rgba(0, 255, 102, 0.08)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'register' ? '2px solid var(--accent-green)' : '2px solid transparent',
              color: activeTab === 'register' ? 'var(--accent-green)' : 'var(--text-muted)',
              fontFamily: 'var(--font-mono)',
              fontWeight: 'bold',
              fontSize: '0.88rem',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              textShadow: activeTab === 'register' ? '0 0 8px var(--accent-green-glow)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            [REGISTER]
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {/* Form Description */}
          <div style={{ marginBottom: '18px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {activeTab === 'login' ? (
              <span>&gt; Provide verified agent credentials to restore encrypted session:</span>
            ) : (
              <span>&gt; Create a new autonomous contractor record in SQLite user registry:</span>
            )}
          </div>

          {/* Username Field */}
          <div className="cyber-input-wrapper">
            <label className="cyber-label" htmlFor="agent-username">
              <span style={{ color: 'var(--accent-green)' }}>#01</span> AGENT CODENAME (USERNAME)
            </label>
            <div className="cyber-input-container">
              <span className="cyber-input-prefix">usr@hacknet:~$</span>
              <input
                id="agent-username"
                type="text"
                className="cyber-input"
                placeholder="e.g. neo, cipher, morpheus"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                spellCheck="false"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="cyber-input-wrapper">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="cyber-label" htmlFor="agent-password">
                <span style={{ color: 'var(--accent-green)' }}>#02</span> ACCESS PASSPHRASE
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                }}
              >
                [{showPassword ? 'MASK KEY' : 'VIEW KEY'}]
              </button>
            </div>
            <div className="cyber-input-container">
              <span className="cyber-input-prefix">key@hacknet:~$</span>
              <input
                id="agent-password"
                type={showPassword ? 'text' : 'password'}
                className="cyber-input"
                placeholder="Enter encrypted security key"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Confirm Password Field (Register Only) */}
          {activeTab === 'register' && (
            <div className="cyber-input-wrapper">
              <label className="cyber-label" htmlFor="agent-confirm-password">
                <span style={{ color: 'var(--accent-green)' }}>#03</span> CONFIRM PASSPHRASE
              </label>
              <div className="cyber-input-container">
                <span className="cyber-input-prefix">chk@hacknet:~$</span>
                <input
                  id="agent-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  className="cyber-input"
                  placeholder="Re-type passphrase to verify"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Cryptography Info Banner */}
          <div
            style={{
              background: 'rgba(0, 240, 255, 0.05)',
              border: '1px dashed rgba(0, 240, 255, 0.25)',
              padding: '10px 12px',
              fontSize: '0.72rem',
              color: 'var(--accent-cyan)',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>ℹ</span>
            <span>
              Passwords hashed via <strong>SHA-256</strong>. Auth tokens signed via <strong>HS256 (JWT)</strong>.
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <button
              type="submit"
              className="btn-cyber"
              disabled={isLoading}
              style={{ width: '100%', padding: '12px 20px' }}
            >
              {isLoading ? (
                <>
                  <span className="pulse-indicator" style={{ background: 'var(--accent-green)' }} />
                  {activeTab === 'login' ? 'VERIFYING CREDENTIALS...' : 'CREATING AGENT RECORD...'}
                </>
              ) : activeTab === 'login' ? (
                '[AUTHENTICATE SESSION]'
              ) : (
                '[INITIALIZE NEW AGENT]'
              )}
            </button>
          </div>
        </form>

        {/* Terminal Footer */}
        <div
          style={{
            padding: '10px 16px',
            background: 'var(--bg-main)',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
          }}
        >
          <span>TOR RELAY: 127.0.0.1:9050</span>
          <span>STATUS: SECURE (NODE #849)</span>
        </div>
      </div>
    </div>
  );
}
