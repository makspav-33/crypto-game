import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import api from '../utils/api';
import { decryptCaesar, calculateTextFrequencies, EN_ALPHABET, UA_ALPHABET } from '../utils/caesarHelper';
import { useToast } from '../components/Toast';

// Custom Cyberpunk Tooltip for Recharts
function CyberpunkTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const interceptedVal = payload.find((p) => p.dataKey === 'intercepted')?.value ?? 0;
    const referenceVal = payload.find((p) => p.dataKey === 'reference')?.value ?? 0;
    const diff = Math.abs(interceptedVal - referenceVal).toFixed(2);

    return (
      <div
        style={{
          background: 'rgba(10, 13, 20, 0.95)',
          border: '1px solid var(--accent-cyan)',
          boxShadow: '0 0 12px var(--accent-cyan-glow)',
          padding: '10px 14px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.78rem',
          borderRadius: '3px',
        }}
      >
        <div style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', marginBottom: '4px' }}>
          CHARACTER: [{label}]
        </div>
        <div style={{ color: 'var(--accent-red)', display: 'flex', gap: '8px' }}>
          <span>● Intercepted:</span>
          <strong>{interceptedVal}%</strong>
        </div>
        <div style={{ color: 'var(--accent-green)', display: 'flex', gap: '8px' }}>
          <span>● Reference ({payload[0]?.payload?.lang?.toUpperCase()}):</span>
          <strong>{referenceVal}%</strong>
        </div>
        <div style={{ color: 'var(--text-muted)', marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '4px' }}>
          Delta variance: <span style={{ color: 'var(--accent-amber)' }}>{diff}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function Lab1Page({ user, onBack, onBalanceUpdate }) {
  const [tasks, setTasks] = useState([]);
  const [activeTaskId, setActiveTaskId] = useState('');
  const [referenceFreqs, setReferenceFreqs] = useState({ en: {}, ua: {} });
  const [currentKey, setCurrentKey] = useState(0);
  const [ciphertext, setCiphertext] = useState('');
  const [language, setLanguage] = useState('en');
  const [sortBy, setSortBy] = useState('alpha'); // 'alpha' | 'freq'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  const toast = useToast();

  // Maximum shift key based on alphabet size
  const maxKey = language === 'ua' ? 32 : 25;

  // Fetch tasks and reference frequencies from backend
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await api.get('/api/lab1/tasks');
        const data = response.data;
        setTasks(data.tasks || []);
        if (data.reference_frequencies) {
          setReferenceFreqs(data.reference_frequencies);
        }

        if (data.tasks && data.tasks.length > 0) {
          const firstTask = data.tasks[0];
          setActiveTaskId(firstTask.id);
          setCiphertext(firstTask.ciphertext);
          setLanguage(firstTask.lang);
        }
      } catch (err) {
        console.error('Failed to load Lab 1 tasks:', err);
        toast.showError('Failed to fetch intercepted intelligence from server', 'DATA LINK ERROR');
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTasks();
  }, []);

  // When active task changes
  const handleTaskSelect = (taskId) => {
    const selected = tasks.find((t) => t.id === taskId);
    if (selected) {
      setActiveTaskId(selected.id);
      setCiphertext(selected.ciphertext);
      setLanguage(selected.lang);
      setCurrentKey(0); // Reset key on task switch
    }
  };

  // Switch language mode manually
  const handleLanguageSwitch = (newLang) => {
    setLanguage(newLang);
    // Find task for that language or keep text
    const matchingTask = tasks.find((t) => t.lang === newLang);
    if (matchingTask) {
      setActiveTaskId(matchingTask.id);
      setCiphertext(matchingTask.ciphertext);
    }
    setCurrentKey(0);
  };

  // Real-time client-side decryption preview
  const decryptedText = useMemo(() => {
    return decryptCaesar(ciphertext, currentKey, language);
  }, [ciphertext, currentKey, language]);

  // Calculate frequencies of the intercepted text
  const interceptedFrequencies = useMemo(() => {
    return calculateTextFrequencies(ciphertext, language);
  }, [ciphertext, language]);

  // Active reference table
  const activeReference = referenceFreqs[language] || {};

  // Build chart dataset
  const chartData = useMemo(() => {
    const alphabet = language === 'ua' ? UA_ALPHABET : EN_ALPHABET;
    const data = alphabet.split('').map((char) => {
      return {
        letter: char,
        intercepted: interceptedFrequencies[char] || 0,
        reference: activeReference[char] || 0,
        lang: language,
      };
    });

    if (sortBy === 'freq') {
      // Sort by intercepted frequency descending
      return [...data].sort((a, b) => b.intercepted - a.intercepted);
    }
    return data;
  }, [language, interceptedFrequencies, activeReference, sortBy]);

  // Key adjuster handlers
  const adjustKey = (delta) => {
    const n = maxKey + 1;
    setCurrentKey((prev) => (((prev + delta) % n) + n) % n);
  };

  // Submission handler
  const handleSubmitDecryption = async () => {
    if (!decryptedText) {
      toast.showError('No decrypted text available for submission', 'VERIFICATION FAILED');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/api/lab1/verify', {
        decrypted_text: decryptedText,
        key: currentKey,
        task_id: activeTaskId,
      });

      const { reward, new_balance, message } = response.data;
      toast.showSuccess(
        message || `DECRYPTION VERIFIED! +$ ${reward} BTC CREDITED TO VAULT`,
        'CONTRACT ACCOMPLISHED'
      );

      if (onBalanceUpdate && new_balance !== undefined) {
        onBalanceUpdate(new_balance);
      }
    } catch (err) {
      console.error('Decryption verification error:', err);
      const serverMessage = err.response?.data?.message || 'INVALID DECRYPTION KEY OR TEXT';
      toast.showError(serverMessage, 'DECRYPTION REJECTED');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeTask = tasks.find((t) => t.id === activeTaskId);

  return (
    <div
      style={{
        flex: 1,
        padding: '24px',
        maxWidth: '1440px',
        margin: '0 auto',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 10,
        position: 'relative',
      }}
    >
      {/* Top Breadcrumb & Contract Banner */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid var(--accent-cyan)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>MARKETPLACE // CONTRACT #1</span>
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent-amber)',
                background: 'rgba(255, 170, 0, 0.1)',
                padding: '2px 6px',
                border: '1px solid var(--accent-amber)',
              }}
            >
              CLASS: FREQUENCY ANALYSIS &amp; CAESAR CIPHER
            </span>
          </div>
          <h1
            style={{
              color: 'var(--text-main)',
              fontSize: '1.3rem',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <span style={{ color: 'var(--accent-green)' }}>[C-01]</span>
            {activeTask?.name || 'Cryptographic Frequency Interceptor'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <div
            style={{
              background: 'rgba(0, 255, 102, 0.08)',
              border: '1px solid var(--accent-green)',
              padding: '6px 12px',
              fontSize: '0.82rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>REWARD: </span>
            <strong style={{ color: 'var(--accent-green)' }}>$ 1,500 BTC</strong>
          </div>

          <button
            type="button"
            className="btn-cyber btn-cyber-danger"
            onClick={onBack}
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            &lt;&lt; BACK TO DASHBOARD
          </button>
        </div>
      </div>

      {/* Task & Language Selection Toolbar */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Language Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            ALPHABET MATRIX:
          </span>
          <button
            type="button"
            className={`btn-cyber ${language === 'en' ? '' : 'btn-cyber-cyan'}`}
            onClick={() => handleLanguageSwitch('en')}
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              background: language === 'en' ? 'var(--accent-green)' : 'transparent',
              color: language === 'en' ? 'var(--bg-main)' : 'var(--accent-cyan)',
              borderColor: language === 'en' ? 'var(--accent-green)' : 'var(--border-color)',
            }}
          >
            [EN] ENGLISH (26)
          </button>
          <button
            type="button"
            className={`btn-cyber ${language === 'ua' ? '' : 'btn-cyber-cyan'}`}
            onClick={() => handleLanguageSwitch('ua')}
            style={{
              padding: '6px 12px',
              fontSize: '0.78rem',
              background: language === 'ua' ? 'var(--accent-green)' : 'transparent',
              color: language === 'ua' ? 'var(--bg-main)' : 'var(--accent-cyan)',
              borderColor: language === 'ua' ? 'var(--accent-green)' : 'var(--border-color)',
            }}
          >
            [UA] UKRAINIAN (33)
          </button>
        </div>

        {/* Task Switcher */}
        {tasks.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>SELECT INTERCEPT:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {tasks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTaskSelect(t.id)}
                  style={{
                    background: activeTaskId === t.id ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                    border: `1px solid ${activeTaskId === t.id ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    color: activeTaskId === t.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    padding: '5px 10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  [{t.name}]
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Section (Section 6.1) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '20px',
        }}
      >
        {/* ====================================================================
            LEFT COLUMN: Encrypted Communication & Live Decryption Controls
            ==================================================================== */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Mission Briefing */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '16px',
            }}
          >
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent-cyan)',
                marginBottom: '6px',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
              }}
            >
              &gt; INTELLIGENCE BRIEFING
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-main)', lineHeight: '1.5', margin: 0 }}>
              {activeTask?.description ||
                'Decipher the intercepted enemy transmission. Utilize frequency variance between standard linguistic distribution and cipher peaks to recover the shift parameter K.'}
            </p>
          </div>

          {/* Intercepted Ciphertext Terminal Box */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'var(--bg-main)',
                borderBottom: '1px solid var(--border-color)',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
              }}
            >
              <span style={{ color: 'var(--accent-red)', fontWeight: 'bold' }}>
                ● INTERCEPTED CIPHERTEXT [SOURCE: TOR RELAY]
              </span>
              <span style={{ color: 'var(--text-muted)' }}>
                CHARS: {ciphertext.length}
              </span>
            </div>

            <textarea
              value={ciphertext}
              onChange={(e) => setCiphertext(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                background: 'rgba(10, 13, 20, 0.85)',
                border: 'none',
                outline: 'none',
                color: 'var(--accent-red)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                padding: '14px',
                lineHeight: '1.6',
                resize: 'vertical',
                caretColor: 'var(--accent-green)',
                letterSpacing: '0.04em',
              }}
              placeholder="Paste or edit intercepted ciphertext..."
            />
          </div>

          {/* Shift Key (K) Slider & Control Panel */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  SHIFT KEY (K):
                </span>
                <span
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--accent-green)',
                    boxShadow: '0 0 8px var(--accent-green-glow)',
                    color: 'var(--accent-green)',
                    padding: '4px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    minWidth: '44px',
                    textAlign: 'center',
                  }}
                >
                  {currentKey}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => adjustKey(-1)}
                  className="btn-cyber"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  title="Shift left"
                >
                  [-1]
                </button>
                <button
                  type="button"
                  onClick={() => adjustKey(1)}
                  className="btn-cyber"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                  title="Shift right"
                >
                  [+1]
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentKey(0)}
                  className="btn-cyber btn-cyber-danger"
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  title="Reset to 0"
                >
                  [K=0]
                </button>
              </div>
            </div>

            {/* Slider */}
            <div>
              <input
                type="range"
                min="0"
                max={maxKey}
                value={currentKey}
                onChange={(e) => setCurrentKey(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent-green)',
                  cursor: 'pointer',
                  height: '6px',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                }}
              >
                <span>MIN: 0</span>
                <span>RANGE: 0–{maxKey} ({language.toUpperCase()})</span>
                <span>MAX: {maxKey}</span>
              </div>
            </div>
          </div>

          {/* Real-Time Decrypted Text Output Preview */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: 'var(--bg-main)',
                borderBottom: '1px solid var(--border-color)',
                padding: '8px 12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.75rem',
              }}
            >
              <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>
                ● REAL-TIME DECRYPTION PREVIEW [SHIFT = -{currentKey}]
              </span>
              <span style={{ color: 'var(--accent-cyan)' }}>LIVE PREVIEW</span>
            </div>

            <div
              style={{
                background: 'rgba(10, 13, 20, 0.95)',
                minHeight: '110px',
                padding: '14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                color: currentKey === 0 ? 'var(--text-muted)' : 'var(--text-code)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                borderLeft: '3px solid var(--accent-green)',
              }}
            >
              {decryptedText || '<Ciphertext stream empty>'}
            </div>
          </div>

          {/* Submission Button */}
          <button
            type="button"
            className="btn-cyber"
            onClick={handleSubmitDecryption}
            disabled={isSubmitting || !decryptedText}
            style={{
              width: '100%',
              padding: '14px 20px',
              fontSize: '0.95rem',
              letterSpacing: '0.08em',
            }}
          >
            {isSubmitting ? (
              <>
                <span className="pulse-indicator" />
                VERIFYING WITH MAINFRAME...
              </>
            ) : (
              '[SUBMIT DECRYPTION & CLAIM $ 1,500 BTC >>]'
            )}
          </button>
        </div>

        {/* ====================================================================
            RIGHT COLUMN: Frequency Histogram (Recharts)
            ==================================================================== */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            borderRadius: '4px',
          }}
        >
          {/* Chart Header & Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '12px',
            }}
          >
            <div>
              <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', margin: 0 }}>
                &gt; FREQUENCY ANALYSIS HISTOGRAM
              </h3>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '2px' }}>
                Comparing intercepted transmission vs. standard {language.toUpperCase()} reference
              </div>
            </div>

            {/* Sort Toggle */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setSortBy('alpha')}
                style={{
                  background: sortBy === 'alpha' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                  border: `1px solid ${sortBy === 'alpha' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                  color: sortBy === 'alpha' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  padding: '4px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                A-Z ORDER
              </button>
              <button
                type="button"
                onClick={() => setSortBy('freq')}
                style={{
                  background: sortBy === 'freq' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                  border: `1px solid ${sortBy === 'freq' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                  color: sortBy === 'freq' ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  padding: '4px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                BY FREQUENCY ▼
              </button>
            </div>
          </div>

          {/* Recharts Bar Chart */}
          <div style={{ width: '100%', height: '360px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 12, right: 12, left: -20, bottom: 20 }}
              >
                <CartesianGrid stroke="rgba(0, 240, 255, 0.08)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="letter"
                  stroke="var(--text-muted)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                  interval={0}
                />
                <YAxis
                  stroke="var(--text-muted)"
                  tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                  unit="%"
                />
                <Tooltip content={<CyberpunkTooltip />} />
                <Legend
                  wrapperStyle={{
                    paddingTop: '8px',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-mono)',
                  }}
                  formatter={(value) => {
                    if (value === 'intercepted') return 'Intercepted Text (%)';
                    if (value === 'reference') return `Reference ${language.toUpperCase()} (%)`;
                    return value;
                  }}
                />
                {/* Intercepted Text: Red / Amber (Section 6.1) */}
                <Bar
                  dataKey="intercepted"
                  fill="var(--accent-red)"
                  stroke="rgba(255, 42, 109, 0.8)"
                  name="intercepted"
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={350}
                />
                {/* Reference Language: Green / Semi-transparent (Section 6.1) */}
                <Bar
                  dataKey="reference"
                  fill="rgba(0, 255, 102, 0.45)"
                  stroke="var(--accent-green)"
                  name="reference"
                  radius={[2, 2, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={350}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Cryptanalysis Strategy Card */}
          <div
            style={{
              background: 'rgba(10, 13, 20, 0.7)',
              border: '1px dashed var(--border-color)',
              padding: '12px 14px',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
            }}
          >
            <div style={{ color: 'var(--accent-amber)', fontWeight: 'bold', marginBottom: '4px' }}>
              💡 CRYPTANALYST STRATEGY (LAB #1):
            </div>
            {language === 'en' ? (
              <span>
                In standard English, <strong>E (~12.7%)</strong>, <strong>T (~9.1%)</strong>, and <strong>A (~8.2%)</strong> are the most frequent characters. Identify the highest red peak in the intercepted message and adjust slider <strong>K</strong> until that peak shifts to align with <strong>E</strong>.
              </span>
            ) : (
              <span>
                В українській мові найбільш частотними є літери <strong>О (~9.28%)</strong>, <strong>А (~7.22%)</strong>, <strong>І (~5.51%)</strong> та <strong>И (~5.38%)</strong>. Знайдіть найвищий червоний стовпчик та зсувайте ключ <strong>K</strong>, поки він не вирівняється з літерою <strong>О</strong>.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
