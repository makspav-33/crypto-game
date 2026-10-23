import React, { useState, useEffect } from 'react';
import CRTOverlay from './components/CRTOverlay';
import Header from './components/Header';
import { ToastProvider, useToast } from './components/Toast';
import AuthScreen from './pages/AuthScreen';
import DashboardPreview from './pages/DashboardPreview';
import Lab1Page from './pages/Lab1Page';
import api, { authStorage } from './utils/api';
import './App.css';

function AppContent() {
  const [user, setUser] = useState(authStorage.getUser());
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard' | 'lab1'
  const toast = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const token = authStorage.getToken();
      if (!token) {
        setIsInitializing(false);
        return;
      }

      try {
        const response = await api.get('/api/auth/me');
        const currentUser = response.data.user;
        setUser(currentUser);
        authStorage.setUser(currentUser);
      } catch (err) {
        console.warn('Existing session invalid or expired:', err);
        authStorage.clearSession();
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();

    // Listen for session expiry event from Axios interceptor
    const handleSessionExpired = () => {
      setUser(null);
      setCurrentPage('dashboard');
      toast.showError('Session expired. Please log in again to renew authorization.', 'SESSION EXPIRED');
    };

    window.addEventListener('hacknet:session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('hacknet:session-expired', handleSessionExpired);
    };
  }, []);

  const handleAuthSuccess = (userData, token) => {
    setUser(userData);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    authStorage.clearSession();
    setUser(null);
    setCurrentPage('dashboard');
    toast.showInfo('Encrypted dark web session terminated. Agent logged out.', 'SESSION DISCONNECTED');
  };

  const handleBalanceUpdate = (newBalance) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, balance: newBalance };
      authStorage.setUser(updated);
      return updated;
    });
  };

  if (isInitializing) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
        }}
      >
        <div className="pulse-indicator" style={{ width: '16px', height: '16px' }} />
        <div style={{ color: 'var(--accent-green)', letterSpacing: '0.1em', fontSize: '0.9rem' }}>
          BOOTING HACKNET OS v1.0...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CRTOverlay />
      <Header
        user={user}
        onLogout={handleLogout}
        onNavigateHome={() => setCurrentPage('dashboard')}
        currentPage={currentPage}
      />

      {user ? (
        currentPage === 'lab1' ? (
          <Lab1Page
            user={user}
            onBack={() => setCurrentPage('dashboard')}
            onBalanceUpdate={handleBalanceUpdate}
          />
        ) : (
          <DashboardPreview
            user={user}
            onLogout={handleLogout}
            onOpenLab1={() => setCurrentPage('lab1')}
          />
        )
      ) : (
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
