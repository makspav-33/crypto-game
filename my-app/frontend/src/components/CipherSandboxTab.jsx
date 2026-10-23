import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import {
  EN_ALPHABET,
  UA_ALPHABET,
  EN_REFERENCE_FREQ,
  UA_REFERENCE_FREQ,
  calculateTextFrequencies,
  getKeyOrder,
} from '../utils/caesarHelper';

const PRESET_TEXTS = [
  { label: 'HACKNET PROTOCOL', text: 'HACKNET PROTOCOL CIPHER LAB' },
  { label: 'CORPORATE INTEL', text: 'INFILTRATING MAINFRAME SERVER' },
  { label: 'DARKWEB RELAY', text: 'TOR NODE PROXY ENCRYPTED CHANNEL' },
  { label: 'UKRAINIAN INTEL', text: 'ПЕРЕХОПЛЕНО ТАЄМНИЙ СИГНАЛ' },
];

const PRESET_KEYS = ['KEY', 'CAB', 'HACK', 'CRYPTO', 'MATRIX', 'CIPHER'];

// Cyberpunk Tooltip for Histogram
function CyberpunkHistogramTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const cipherVal = payload.find((p) => p.dataKey === 'ciphertext')?.value ?? 0;
    const refVal = payload.find((p) => p.dataKey === 'reference')?.value ?? 0;
    const delta = Math.abs(cipherVal - refVal).toFixed(2);

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
          <span>● Encrypted Stream:</span>
          <strong>{cipherVal}%</strong>
        </div>
        <div style={{ color: 'var(--accent-green)', display: 'flex', gap: '8px' }}>
          <span>● Reference Standard:</span>
          <strong>{refVal}%</strong>
        </div>
        <div style={{ color: 'var(--text-muted)', marginTop: '4px', borderTop: '1px dashed var(--border-color)', paddingTop: '4px' }}>
          Variance Delta: <span style={{ color: 'var(--accent-amber)' }}>{delta}%</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function CipherSandboxTab() {
  const [activeCipherType, setActiveCipherType] = useState('shift'); // 'shift' | 'transposition'
  const [inputText, setInputText] = useState('HACKNET PROTOCOL CIPHER LAB');
  const [language, setLanguage] = useState('en'); // 'en' | 'ua'

  // Shift Cipher State
  const [shiftKey, setShiftKey] = useState(3);
  const [hoveredCharIndex, setHoveredCharIndex] = useState(null);
  const [chartSortBy, setChartSortBy] = useState('alpha'); // 'alpha' | 'freq'

  // Transposition Cipher State (Key-Based)
  const [userKey, setUserKey] = useState('CRYPTO');
  const [transMode, setTransMode] = useState('vertical'); // 'vertical' | 'horizontal' | 'diagonal'

  // Animation State for Transposition
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(400); // ms per step
  const timerRef = useRef(null);

  const alphabet = language === 'ua' ? UA_ALPHABET : EN_ALPHABET;
  const maxShift = alphabet.length - 1;

  // Clean formatted input text
  const cleanInput = useMemo(() => {
    return (inputText || 'HACKNET').toUpperCase();
  }, [inputText]);

  // -------------------------------------------------------------
  // 1. SHIFT CIPHER LOGIC & ALIGNMENT TRACKS
  // -------------------------------------------------------------
  const shiftedAlphabet = useMemo(() => {
    const n = alphabet.length;
    const k = ((shiftKey % n) + n) % n;
    return alphabet.slice(k) + alphabet.slice(0, k);
  }, [alphabet, shiftKey]);

  // Encrypted text stream for Shift
  const shiftEncryptedText = useMemo(() => {
    const n = alphabet.length;
    const k = ((shiftKey % n) + n) % n;
    return cleanInput
      .split('')
      .map((char) => {
        const idx = alphabet.indexOf(char);
        if (idx !== -1) {
          return alphabet[(idx + k) % n];
        }
        return char;
      })
      .join('');
  }, [cleanInput, alphabet, shiftKey]);

  // Real-time frequency calculation for Shift Encrypted Text
  const encryptedFrequencies = useMemo(() => {
    return calculateTextFrequencies(shiftEncryptedText, language);
  }, [shiftEncryptedText, language]);

  // Active reference table
  const activeReference = language === 'ua' ? UA_REFERENCE_FREQ : EN_REFERENCE_FREQ;

  // Build Shift Frequency Histogram Dataset
  const shiftHistogramData = useMemo(() => {
    const data = alphabet.split('').map((char) => {
      return {
        letter: char,
        ciphertext: encryptedFrequencies[char] || 0,
        reference: activeReference[char] || 0,
      };
    });

    if (chartSortBy === 'freq') {
      return [...data].sort((a, b) => b.ciphertext - a.ciphertext);
    }
    return data;
  }, [alphabet, encryptedFrequencies, activeReference, chartSortBy]);

  // -------------------------------------------------------------
  // 2. KEY-BASED TRANSPOSITION CIPHER LOGIC
  // -------------------------------------------------------------
  const { cleanKey, colOrder, ranks } = useMemo(() => {
    return getKeyOrder(userKey);
  }, [userKey]);

  const transpositionData = useMemo(() => {
    const chars = cleanInput.split('');
    const len = chars.length;
    const cols = cleanKey.length;
    const rows = Math.max(1, Math.ceil(len / cols));

    // Fill 2D Matrix (row by row)
    const grid = [];
    let charIdx = 0;
    for (let r = 0; r < rows; r++) {
      const rowArr = [];
      for (let c = 0; c < cols; c++) {
        if (charIdx < len) {
          rowArr.push(chars[charIdx]);
          charIdx++;
        } else {
          rowArr.push('•'); // Padding marker
        }
      }
      grid.push(rowArr);
    }

    const pathSteps = [];
    const cipherChars = [];
    let stepCounter = 0;

    if (transMode === 'vertical') {
      // Keyed Columnar: Read column-by-column in order of key ranks
      for (let c of colOrder) {
        const keyChar = cleanKey[c];
        const rank = ranks[c];
        for (let r = 0; r < rows; r++) {
          const ch = grid[r][c];
          cipherChars.push(ch);
          pathSteps.push({
            step: stepCounter,
            row: r,
            col: c,
            char: ch,
            keyChar,
            rank,
            pathDesc: `Col #${c + 1} ['${keyChar}' Rank #${rank}] ➔ Row #${r + 1}`,
          });
          stepCounter++;
        }
      }
    } else if (transMode === 'horizontal') {
      // Key-Permuted Horizontal: In each row, extract characters in order of key ranks
      for (let r = 0; r < rows; r++) {
        for (let c of colOrder) {
          const keyChar = cleanKey[c];
          const rank = ranks[c];
          const ch = grid[r][c];
          cipherChars.push(ch);
          pathSteps.push({
            step: stepCounter,
            row: r,
            col: c,
            char: ch,
            keyChar,
            rank,
            pathDesc: `Row #${r + 1} ➔ Col #${c + 1} ['${keyChar}' Rank #${rank}]`,
          });
          stepCounter++;
        }
      }
    } else {
      // Key-Guided Diagonal Transposition:
      // Traverse diagonals initiated from columns in key rank order
      const visited = new Set();
      for (let cStart of colOrder) {
        const keyChar = cleanKey[cStart];
        const rank = ranks[cStart];
        for (let r = 0; r < rows; r++) {
          const c = (cStart + r) % cols;
          const cellKey = `${r},${c}`;
          if (!visited.has(cellKey)) {
            visited.add(cellKey);
            const ch = grid[r][c];
            cipherChars.push(ch);
            pathSteps.push({
              step: stepCounter,
              row: r,
              col: c,
              char: ch,
              keyChar,
              rank,
              pathDesc: `Diagonal [Key '${keyChar}' Rank #${rank}] ➔ (${r + 1}, ${c + 1})`,
            });
            stepCounter++;
          }
        }
      }

      // Safety check for residual cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cellKey = `${r},${c}`;
          if (!visited.has(cellKey)) {
            visited.add(cellKey);
            const ch = grid[r][c];
            cipherChars.push(ch);
            pathSteps.push({
              step: stepCounter,
              row: r,
              col: c,
              char: ch,
              keyChar: cleanKey[c],
              rank: ranks[c],
              pathDesc: `Diagonal Residual ➔ (${r + 1}, ${c + 1})`,
            });
            stepCounter++;
          }
        }
      }
    }

    return {
      rows,
      cols,
      grid,
      steps: pathSteps,
      ciphertext: cipherChars.join(''),
    };
  }, [cleanInput, cleanKey, colOrder, ranks, transMode]);

  // Reset animation step when transposition parameters change
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [transMode, cleanKey, cleanInput]);

  // Animation player loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= transpositionData.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, animSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, animSpeed, transpositionData.steps.length]);

  const activeStepObj = transpositionData.steps[currentStep] || null;

  // Stream accumulated output up to currentStep
  const animatedCiphertextOutput = useMemo(() => {
    return transpositionData.steps
      .slice(0, currentStep + 1)
      .map((s) => s.char)
      .join('');
  }, [transpositionData.steps, currentStep]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        maxWidth: '1240px',
        margin: '0 auto',
        width: '100%',
      }}
    >
      {/* Top Header & Subsystem Mode Switcher */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderLeft: '4px solid var(--accent-green)',
          padding: '18px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ color: 'var(--accent-cyan)', fontSize: '0.75rem', letterSpacing: '0.08em', marginBottom: '4px' }}>
            [CRYPTOGRAPHIC SUBSYSTEM] // REAL-TIME CIPHER LAB
          </div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--accent-green)' }}>
            CIPHER LAB / CRYPTO SANDBOX
          </h2>
        </div>

        {/* Primary Cipher Switcher */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn-cyber ${activeCipherType === 'shift' ? '' : 'btn-cyber-cyan'}`}
            onClick={() => setActiveCipherType('shift')}
            style={{
              background: activeCipherType === 'shift' ? 'var(--accent-green)' : 'transparent',
              color: activeCipherType === 'shift' ? 'var(--bg-main)' : 'var(--accent-cyan)',
              borderColor: activeCipherType === 'shift' ? 'var(--accent-green)' : 'var(--border-color)',
              padding: '8px 16px',
              fontSize: '0.85rem',
            }}
          >
            [1. SHIFT (CAESAR) CIPHER]
          </button>
          <button
            type="button"
            className={`btn-cyber ${activeCipherType === 'transposition' ? '' : 'btn-cyber-cyan'}`}
            onClick={() => setActiveCipherType('transposition')}
            style={{
              background: activeCipherType === 'transposition' ? 'var(--accent-green)' : 'transparent',
              color: activeCipherType === 'transposition' ? 'var(--bg-main)' : 'var(--accent-cyan)',
              borderColor: activeCipherType === 'transposition' ? 'var(--accent-green)' : 'var(--border-color)',
              padding: '8px 16px',
              fontSize: '0.85rem',
            }}
          >
            [2. KEYED TRANSPOSITION CIPHER]
          </button>
        </div>
      </div>

      {/* Source Plaintext Console */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            &gt; SOURCE PLAINTEXT INPUT:
          </label>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>PRESETS:</span>
            {PRESET_TEXTS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setInputText(preset.text);
                  if (preset.label.includes('UKRAINIAN')) setLanguage('ua');
                  else setLanguage('en');
                }}
                style={{
                  background: 'rgba(10, 13, 20, 0.7)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '3px 8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cyber-input-container">
          <span className="cyber-input-prefix">in@lab:~$</span>
          <input
            type="text"
            className="cyber-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type plaintext to visualize encryption..."
            spellCheck="false"
          />
        </div>
      </div>

      {/* ====================================================================
          SECTION 1: SHIFT CIPHER WITH REAL-TIME FREQUENCY ANALYSIS DIAGRAM
          ==================================================================== */}
      {activeCipherType === 'shift' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Shift Parameter Controls */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '0.95rem' }}>
                  SHIFT KEY PARAMETER (K):
                </span>
                <span
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--accent-green)',
                    boxShadow: '0 0 10px var(--accent-green-glow)',
                    color: 'var(--accent-green)',
                    padding: '4px 16px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                  }}
                >
                  +{shiftKey}
                </span>
              </div>

              {/* Language Switcher */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className={`btn-cyber ${language === 'en' ? '' : 'btn-cyber-cyan'}`}
                  onClick={() => setLanguage('en')}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  [EN (26)]
                </button>
                <button
                  type="button"
                  className={`btn-cyber ${language === 'ua' ? '' : 'btn-cyber-cyan'}`}
                  onClick={() => setLanguage('ua')}
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  [UA (33)]
                </button>
                <button
                  type="button"
                  onClick={() => setShiftKey(0)}
                  className="btn-cyber btn-cyber-danger"
                  style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                >
                  [RESET K=0]
                </button>
              </div>
            </div>

            {/* Shift Slider */}
            <div>
              <input
                type="range"
                min="0"
                max={maxShift}
                value={shiftKey}
                onChange={(e) => setShiftKey(Number(e.target.value))}
                style={{
                  width: '100%',
                  accentColor: 'var(--accent-green)',
                  cursor: 'pointer',
                  height: '6px',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>MIN: 0</span>
                <span>FORMULA: C = (P + {shiftKey}) mod {alphabet.length}</span>
                <span>MAX: {maxShift}</span>
              </div>
            </div>
          </div>

          {/* Dual Parallel Alphabet Tracks */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '20px',
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                &gt; PARALLEL ALPHABET ALIGNMENT TRACKS
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Hover characters to inspect dynamic Caesar mapping
              </span>
            </div>

            {/* Track 1: Original Track */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                ORIGINAL PLAINTEXT TRACK (P):
              </div>
              <div style={{ display: 'flex', gap: '3px', minWidth: '700px' }}>
                {alphabet.split('').map((char, idx) => {
                  const isHovered = hoveredCharIndex === idx;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredCharIndex(idx)}
                      onMouseLeave={() => setHoveredCharIndex(null)}
                      style={{
                        flex: 1,
                        minWidth: '22px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isHovered ? 'var(--accent-green)' : 'rgba(10, 13, 20, 0.8)',
                        color: isHovered ? 'var(--bg-main)' : 'var(--text-main)',
                        border: `1px solid ${isHovered ? 'var(--accent-green)' : 'var(--border-color)'}`,
                        boxShadow: isHovered ? '0 0 10px var(--accent-green-glow)' : 'none',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        fontWeight: 'bold',
                        transition: 'all 0.15s ease',
                        cursor: 'pointer',
                      }}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Connecting Indicators */}
            <div style={{ display: 'flex', gap: '3px', minWidth: '700px', margin: '2px 0' }}>
              {alphabet.split('').map((_, idx) => {
                const isHovered = hoveredCharIndex === idx;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      minWidth: '22px',
                      textAlign: 'center',
                      color: isHovered ? 'var(--accent-green)' : 'rgba(98, 114, 164, 0.4)',
                      fontSize: '0.75rem',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    ↓
                  </div>
                );
              })}
            </div>

            {/* Track 2: Ciphertext Track */}
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)', marginBottom: '4px' }}>
                SHIFTED CIPHERTEXT TRACK (C = P + {shiftKey}):
              </div>
              <div style={{ display: 'flex', gap: '3px', minWidth: '700px' }}>
                {shiftedAlphabet.split('').map((char, idx) => {
                  const isHovered = hoveredCharIndex === idx;
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredCharIndex(idx)}
                      onMouseLeave={() => setHoveredCharIndex(null)}
                      style={{
                        flex: 1,
                        minWidth: '22px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isHovered ? 'var(--accent-red)' : 'rgba(255, 42, 109, 0.08)',
                        color: isHovered ? '#fff' : 'var(--accent-red)',
                        border: `1px solid ${isHovered ? 'var(--accent-red)' : 'rgba(255, 42, 109, 0.3)'}`,
                        boxShadow: isHovered ? '0 0 12px rgba(255, 42, 109, 0.5)' : 'none',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.82rem',
                        fontWeight: 'bold',
                        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        cursor: 'pointer',
                      }}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Real-time Frequency Analysis Diagram (Section 1 Requirement) */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '0.95rem', color: 'var(--accent-cyan)', margin: 0 }}>
                  &gt; REAL-TIME FREQUENCY ANALYSIS DIAGRAM (SHIFT KEY K={shiftKey})
                </h3>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Dynamic spectrum comparison: Encrypted ciphertext stream vs. standard {language.toUpperCase()} reference curve
                </div>
              </div>

              {/* Sort Switcher */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setChartSortBy('alpha')}
                  style={{
                    background: chartSortBy === 'alpha' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                    border: `1px solid ${chartSortBy === 'alpha' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    color: chartSortBy === 'alpha' ? 'var(--accent-cyan)' : 'var(--text-muted)',
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
                  onClick={() => setChartSortBy('freq')}
                  style={{
                    background: chartSortBy === 'freq' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                    border: `1px solid ${chartSortBy === 'freq' ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                    color: chartSortBy === 'freq' ? 'var(--accent-cyan)' : 'var(--text-muted)',
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
            <div style={{ width: '100%', height: '320px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={shiftHistogramData}
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
                  <Tooltip content={<CyberpunkHistogramTooltip />} />
                  <Legend
                    wrapperStyle={{
                      paddingTop: '8px',
                      fontSize: '0.75rem',
                      fontFamily: 'var(--font-mono)',
                    }}
                    formatter={(value) => {
                      if (value === 'ciphertext') return `Encrypted Text (Shift +${shiftKey})`;
                      if (value === 'reference') return `Reference Standard (${language.toUpperCase()})`;
                      return value;
                    }}
                  />
                  {/* Encrypted text frequency: Amber / Red (Section 1 requirement) */}
                  <Bar
                    dataKey="ciphertext"
                    fill="var(--accent-amber)"
                    stroke="var(--accent-red)"
                    name="ciphertext"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                  {/* Reference language frequency: Semi-transparent Green (Section 1 requirement) */}
                  <Bar
                    dataKey="reference"
                    fill="rgba(0, 255, 102, 0.4)"
                    stroke="var(--accent-green)"
                    name="reference"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={true}
                    animationDuration={300}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stream Output */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--accent-green)',
              boxShadow: '0 0 15px var(--accent-green-glow)',
              padding: '16px 20px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', marginBottom: '6px', fontWeight: 'bold' }}>
              &gt; LIVE SHIFT CIPHERTEXT STREAM (K={shiftKey}):
            </div>
            <div
              style={{
                background: 'var(--bg-main)',
                padding: '12px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.95rem',
                color: 'var(--text-code)',
                borderLeft: '3px solid var(--accent-green)',
                wordBreak: 'break-all',
              }}
            >
              {shiftEncryptedText}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SECTION 2: KEY-BASED TRANSPOSITION CIPHER (USER TEXT KEY)
          ==================================================================== */}
      {activeCipherType === 'transposition' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* User Text Key Input & Trajectory Mode Panel */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* User Key Input & Presets */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold', fontSize: '0.85rem' }}>
                  USER-DEFINED KEY:
                </span>
                <input
                  type="text"
                  value={userKey}
                  onChange={(e) => setUserKey(e.target.value.toUpperCase())}
                  placeholder="Enter keyword (e.g. CRYPTO)"
                  maxLength={12}
                  style={{
                    background: 'var(--bg-main)',
                    border: '1px solid var(--accent-cyan)',
                    color: 'var(--accent-cyan)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    padding: '6px 12px',
                    outline: 'none',
                    letterSpacing: '0.1em',
                    boxShadow: '0 0 8px var(--accent-cyan-glow)',
                    width: '160px',
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({cleanKey.length} COLS)
                </span>
              </div>

              {/* Quick Key Presets */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>KEY PRESETS:</span>
                {PRESET_KEYS.map((k, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setUserKey(k)}
                    style={{
                      background: cleanKey === k ? 'var(--accent-cyan)' : 'rgba(10, 13, 20, 0.7)',
                      color: cleanKey === k ? 'var(--bg-main)' : 'var(--accent-cyan)',
                      border: `1px solid ${cleanKey === k ? 'var(--accent-cyan)' : 'var(--border-color)'}`,
                      padding: '4px 8px',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Transposition Mode Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  TRANSPOSITION MODE:
                </span>
                <button
                  type="button"
                  className={`btn-cyber ${transMode === 'vertical' ? '' : 'btn-cyber-cyan'}`}
                  onClick={() => setTransMode('vertical')}
                  style={{
                    background: transMode === 'vertical' ? 'var(--accent-green)' : 'transparent',
                    color: transMode === 'vertical' ? 'var(--bg-main)' : 'var(--accent-cyan)',
                    borderColor: transMode === 'vertical' ? 'var(--accent-green)' : 'var(--border-color)',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                  }}
                >
                  [1. VERTICAL (COLUMNAR)]
                </button>
                <button
                  type="button"
                  className={`btn-cyber ${transMode === 'horizontal' ? '' : 'btn-cyber-cyan'}`}
                  onClick={() => setTransMode('horizontal')}
                  style={{
                    background: transMode === 'horizontal' ? 'var(--accent-green)' : 'transparent',
                    color: transMode === 'horizontal' ? 'var(--bg-main)' : 'var(--accent-cyan)',
                    borderColor: transMode === 'horizontal' ? 'var(--accent-green)' : 'var(--border-color)',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                  }}
                >
                  [2. HORIZONTAL (ROW-PERMUTED)]
                </button>
                <button
                  type="button"
                  className={`btn-cyber ${transMode === 'diagonal' ? '' : 'btn-cyber-cyan'}`}
                  onClick={() => setTransMode('diagonal')}
                  style={{
                    background: transMode === 'diagonal' ? 'var(--accent-green)' : 'transparent',
                    color: transMode === 'diagonal' ? 'var(--bg-main)' : 'var(--accent-cyan)',
                    borderColor: transMode === 'diagonal' ? 'var(--accent-green)' : 'var(--border-color)',
                    padding: '6px 12px',
                    fontSize: '0.78rem',
                  }}
                >
                  [3. DIAGONAL (KEY-GUIDED)]
                </button>
              </div>

              {/* Matrix Dimensions Summary */}
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontFamily: 'var(--font-mono)' }}>
                GRID: {transpositionData.rows} ROWS × {transpositionData.cols} COLS
              </div>
            </div>

            {/* Animation Controls Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                borderTop: '1px dashed var(--border-color)',
                paddingTop: '12px',
              }}
            >
              {/* Play / Step Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-cyber"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                >
                  {isPlaying ? '❚❚ PAUSE ANIMATION' : '▶ PLAY STEP-BY-STEP'}
                </button>
                <button
                  type="button"
                  className="btn-cyber"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={currentStep === 0}
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  title="Previous Step"
                >
                  ◀ PREV
                </button>
                <button
                  type="button"
                  className="btn-cyber"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep((prev) => Math.min(transpositionData.steps.length - 1, prev + 1));
                  }}
                  disabled={currentStep >= transpositionData.steps.length - 1}
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  title="Next Step"
                >
                  NEXT ▶
                </button>
                <button
                  type="button"
                  className="btn-cyber btn-cyber-danger"
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentStep(0);
                  }}
                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                  title="Reset to start"
                >
                  [RESET]
                </button>
              </div>

              {/* Active Step Status */}
              <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>PROGRESS: </span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                  {currentStep + 1} / {transpositionData.steps.length}
                </span>
                {activeStepObj && (
                  <span style={{ marginLeft: '12px', color: 'var(--accent-amber)' }}>
                    [{activeStepObj.pathDesc}] ➔ CHAR '{activeStepObj.char}'
                  </span>
                )}
              </div>

              {/* Speed Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>SPEED:</span>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="50"
                  value={1100 - animSpeed}
                  onChange={(e) => setAnimSpeed(1100 - Number(e.target.value))}
                  style={{ width: '80px', accentColor: 'var(--accent-green)', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>

          {/* Key-Based Visual Matrix Grid (Section 2 Requirement) */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '20px',
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                  &gt; KEY-PERMUTED 2D MATRIX (KEY: "{cleanKey}")
                </span>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Alphabetical Column Order: {colOrder.map((colIdx) => `${cleanKey[colIdx]}(#${ranks[colIdx]})`).join(' ➔ ')}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', background: 'var(--accent-cyan)', display: 'inline-block' }} />
                  ACTIVE CELL
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '10px', height: '10px', background: 'rgba(0, 255, 102, 0.4)', display: 'inline-block' }} />
                  EXTRACTED
                </span>
              </div>
            </div>

            {/* Matrix Table with Key Header */}
            <div
              style={{
                display: 'inline-block',
                background: 'rgba(10, 13, 20, 0.95)',
                padding: '16px',
                border: '1px solid var(--border-color)',
                borderRadius: '3px',
                minWidth: '100%',
              }}
            >
              <table
                style={{
                  borderCollapse: 'separate',
                  borderSpacing: '6px',
                  margin: '0 auto',
                }}
              >
                {/* Key Letter & Rank Header */}
                <thead>
                  {/* Row 1: Key Letters */}
                  <tr>
                    <th style={{ color: 'var(--text-muted)', fontSize: '0.68rem', padding: '4px' }}>KEY</th>
                    {cleanKey.split('').map((kChar, cIdx) => (
                      <th
                        key={cIdx}
                        style={{
                          background: 'rgba(0, 240, 255, 0.1)',
                          border: activeStepObj?.col === cIdx ? '1px solid var(--accent-cyan)' : '1px solid rgba(0, 240, 255, 0.3)',
                          boxShadow: activeStepObj?.col === cIdx ? '0 0 10px var(--accent-cyan-glow)' : 'none',
                          color: 'var(--accent-cyan)',
                          fontSize: '1rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 'bold',
                          padding: '6px 10px',
                          textAlign: 'center',
                        }}
                      >
                        {kChar}
                      </th>
                    ))}
                  </tr>
                  {/* Row 2: Alphabetical Ranks */}
                  <tr>
                    <th style={{ color: 'var(--text-muted)', fontSize: '0.68rem', padding: '4px' }}>RANK</th>
                    {ranks.map((rankVal, cIdx) => (
                      <th
                        key={cIdx}
                        style={{
                          background: 'rgba(255, 170, 0, 0.08)',
                          border: '1px dashed rgba(255, 170, 0, 0.3)',
                          color: 'var(--accent-amber)',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '3px 8px',
                          textAlign: 'center',
                        }}
                        title={`Column ${cIdx + 1} will be read in order #${rankVal}`}
                      >
                        #{rankVal}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Matrix Rows */}
                <tbody>
                  {transpositionData.grid.map((rowArr, rIdx) => (
                    <tr key={rIdx}>
                      <td
                        style={{
                          color: activeStepObj?.row === rIdx ? 'var(--accent-green)' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '4px 8px',
                          borderRight: activeStepObj?.row === rIdx ? '2px solid var(--accent-green)' : '1px solid var(--border-color)',
                          textAlign: 'center',
                        }}
                      >
                        R{rIdx + 1}
                      </td>
                      {rowArr.map((cellChar, cIdx) => {
                        const isActive = activeStepObj?.row === rIdx && activeStepObj?.col === cIdx;
                        const stepIndexForCell = transpositionData.steps.findIndex(
                          (s) => s.row === rIdx && s.col === cIdx
                        );
                        const isVisited = stepIndexForCell !== -1 && stepIndexForCell <= currentStep;

                        return (
                          <td
                            key={cIdx}
                            style={{
                              width: '46px',
                              height: '46px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              color: isActive
                                ? 'var(--bg-main)'
                                : isVisited
                                ? 'var(--accent-green)'
                                : 'var(--text-main)',
                              background: isActive
                                ? 'var(--accent-cyan)'
                                : isVisited
                                ? 'rgba(0, 255, 102, 0.12)'
                                : 'rgba(18, 24, 36, 0.8)',
                              border: isActive
                                ? '2px solid #ffffff'
                                : isVisited
                                ? '1px solid var(--accent-green)'
                                : '1px solid var(--border-color)',
                              boxShadow: isActive
                                ? '0 0 16px var(--accent-cyan-glow)'
                                : isVisited
                                ? '0 0 6px var(--accent-green-glow)'
                                : 'none',
                              transition: 'all 0.2s ease',
                              userSelect: 'none',
                            }}
                          >
                            {cellChar}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Real-Time Extraction Stream Buffer */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', fontWeight: 'bold' }}>
                &gt; REAL-TIME CIPHERTEXT ACCUMULATION BUFFER:
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {animatedCiphertextOutput.length} of {transpositionData.ciphertext.length} characters emitted
              </span>
            </div>

            <div
              style={{
                background: 'var(--bg-main)',
                border: '1px solid var(--accent-green)',
                boxShadow: '0 0 12px var(--accent-green-glow)',
                padding: '14px 18px',
                fontFamily: 'var(--font-mono)',
                fontSize: '1.05rem',
                color: 'var(--accent-green)',
                letterSpacing: '0.1em',
                minHeight: '52px',
                wordBreak: 'break-all',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span>{animatedCiphertextOutput}</span>
              <span className="cursor-blink" aria-hidden="true" />
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              <strong>Trajectory Rule: </strong>
              {transMode === 'vertical' && (
                <span>Columns are read top-to-bottom strictly in the alphabetical order of key '{cleanKey}': {colOrder.map((c) => `${cleanKey[c]} (#${ranks[c]})`).join(' ➔ ')}.</span>
              )}
              {transMode === 'horizontal' && (
                <span>Rows are read row-by-row with character positions rearranged according to key ranks: {colOrder.map((c) => `${cleanKey[c]} (#${ranks[c]})`).join(' ➔ ')}.</span>
              )}
              {transMode === 'diagonal' && (
                <span>Diagonals are scanned across the matrix initiated from columns ordered by key ranks: {colOrder.map((c) => `${cleanKey[c]} (#${ranks[c]})`).join(' ➔ ')}.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
