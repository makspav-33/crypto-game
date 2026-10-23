import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EN_ALPHABET, UA_ALPHABET, decryptCaesar } from '../utils/caesarHelper';

const PRESET_TEXTS = [
  { label: 'HACKNET PROTOCOL', text: 'HACKNET PROTOCOL CIPHER LAB' },
  { label: 'CORPORATE INTEL', text: 'INFILTRATING MAINFRAME SERVER' },
  { label: 'DARKWEB RELAY', text: 'TOR NODE PROXY ENCRYPTED CHANNEL' },
  { label: 'UKRAINIAN INTEL', text: 'ПЕРЕХОПЛЕНО ТАЄМНИЙ СИГНАЛ' },
];

export default function CipherSandboxTab() {
  const [activeCipherType, setActiveCipherType] = useState('shift'); // 'shift' | 'transposition'
  const [inputText, setInputText] = useState('HACKNET PROTOCOL CIPHER LAB');
  const [language, setLanguage] = useState('en'); // 'en' | 'ua'

  // Shift Cipher State
  const [shiftKey, setShiftKey] = useState(3);
  const [hoveredCharIndex, setHoveredCharIndex] = useState(null);

  // Transposition Cipher State
  const [transMode, setTransMode] = useState('vertical'); // 'vertical' | 'horizontal' | 'diagonal'
  const [matrixCols, setMatrixCols] = useState(5);
  const [railRows, setRailRows] = useState(3);

  // Animation State for Transposition
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animSpeed, setAnimSpeed] = useState(400); // ms per step
  const timerRef = useRef(null);

  const alphabet = language === 'ua' ? UA_ALPHABET : EN_ALPHABET;
  const maxShift = alphabet.length - 1;

  // Clean formatted text for matrix
  const cleanInput = useMemo(() => {
    return (inputText || 'HACKNET').toUpperCase();
  }, [inputText]);

  // -------------------------------------------------------------
  // SHIFT CIPHER LOGIC & CHARACTER TRACKS
  // -------------------------------------------------------------
  const shiftedAlphabet = useMemo(() => {
    const n = alphabet.length;
    const k = ((shiftKey % n) + n) % n;
    return alphabet.slice(k) + alphabet.slice(0, k);
  }, [alphabet, shiftKey]);

  // Encrypted text for Shift
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

  // -------------------------------------------------------------
  // TRANSPOSITION CIPHER LOGIC & MATRIX GENERATION
  // -------------------------------------------------------------
  const transpositionData = useMemo(() => {
    const chars = cleanInput.split('');
    const len = chars.length;

    if (transMode === 'diagonal') {
      // Rail-Fence Zigzag Diagonal Transposition
      const rows = Math.max(2, Math.min(railRows, 6));
      const grid = Array.from({ length: rows }, () => Array(len).fill(''));

      let r = 0;
      let goingDown = false;
      const pathSteps = [];

      // Step 1: Place chars in zigzag pattern
      for (let c = 0; c < len; c++) {
        grid[r][c] = chars[c];
        if (r === 0 || r === rows - 1) {
          goingDown = !goingDown;
        }
        r += goingDown ? 1 : -1;
      }

      // Step 2: Read row by row
      let stepCounter = 0;
      const cipherChars = [];
      for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
        for (let colIdx = 0; colIdx < len; colIdx++) {
          if (grid[rowIdx][colIdx] !== '') {
            cipherChars.push(grid[rowIdx][colIdx]);
            pathSteps.push({
              step: stepCounter,
              row: rowIdx,
              col: colIdx,
              char: grid[rowIdx][colIdx],
              pathDesc: `Rail #${rowIdx + 1} at Col ${colIdx + 1}`,
            });
            stepCounter++;
          }
        }
      }

      return {
        rows,
        cols: len,
        grid,
        steps: pathSteps,
        ciphertext: cipherChars.join(''),
        isRailFence: true,
      };
    } else {
      // Standard 2D Grid (Vertical or Horizontal)
      const cols = Math.max(2, Math.min(matrixCols, 10));
      const rows = Math.ceil(len / cols);
      const grid = [];
      let charIdx = 0;

      for (let r = 0; r < rows; r++) {
        const rowArr = [];
        for (let c = 0; c < cols; c++) {
          if (charIdx < len) {
            rowArr.push(chars[charIdx]);
            charIdx++;
          } else {
            rowArr.push('•'); // Padding
          }
        }
        grid.push(rowArr);
      }

      const pathSteps = [];
      const cipherChars = [];
      let stepCounter = 0;

      if (transMode === 'vertical') {
        // Read Column-by-Column (Top to Bottom)
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const ch = grid[r][c];
            cipherChars.push(ch);
            pathSteps.push({
              step: stepCounter,
              row: r,
              col: c,
              char: ch,
              pathDesc: `Col ${c + 1} ➔ Row ${r + 1}`,
            });
            stepCounter++;
          }
        }
      } else {
        // Horizontal: Alternating snake path (Boustrophedon)
        for (let r = 0; r < rows; r++) {
          const colIndices = r % 2 === 0
            ? Array.from({ length: cols }, (_, i) => i)
            : Array.from({ length: cols }, (_, i) => cols - 1 - i);

          for (let c of colIndices) {
            const ch = grid[r][c];
            cipherChars.push(ch);
            pathSteps.push({
              step: stepCounter,
              row: r,
              col: c,
              char: ch,
              pathDesc: `Row ${r + 1} (${r % 2 === 0 ? 'L ➔ R' : 'R ➔ L'}) Col ${c + 1}`,
            });
            stepCounter++;
          }
        }
      }

      return {
        rows,
        cols,
        grid,
        steps: pathSteps,
        ciphertext: cipherChars.join(''),
        isRailFence: false,
      };
    }
  }, [cleanInput, transMode, matrixCols, railRows]);

  // Reset or constrain animation step when matrix changes
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [transMode, matrixCols, railRows, cleanInput]);

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
      {/* Top Sandbox Header & Mode Selector */}
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
            [CRYPTOGRAPHIC SUBSYSTEM] // INTERACTIVE VISUALIZER
          </div>
          <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--accent-green)' }}>
            CIPHER LAB / CRYPTO SANDBOX
          </h2>
        </div>

        {/* Mode Switcher */}
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
            [2. TRANSPOSITION CIPHER]
          </button>
        </div>
      </div>

      {/* Input Text Console */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          padding: '16px 20px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
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
          VIEW 1: SHIFT CIPHER VISUALIZATION
          ==================================================================== */}
      {activeCipherType === 'shift' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Shift Controls Panel */}
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

            {/* Slider */}
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
                <span>MIN: 0 (No shift)</span>
                <span>FORMULA: C = (P + {shiftKey}) mod {alphabet.length}</span>
                <span>MAX: {maxShift}</span>
              </div>
            </div>
          </div>

          {/* Dual Parallel Alphabet Tracks (Plaintext Track vs Ciphertext Track) */}
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
                &gt; ALPHABET SHIFT TRACKS (PARALLEL MAPPING)
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Hover characters to inspect dynamic alignment
              </span>
            </div>

            {/* Track 1: Plaintext Original Track */}
            <div style={{ marginBottom: '10px' }}>
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

            {/* Connecting Directional Indicators */}
            <div style={{ display: 'flex', gap: '3px', minWidth: '700px', margin: '4px 0' }}>
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

            {/* Track 2: Ciphertext Shifted Track */}
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

          {/* Real-Time Result Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Input Breakdown */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-color)',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                ORIGINAL STREAM ({cleanInput.length} CHARS)
              </div>
              <div
                style={{
                  background: 'var(--bg-main)',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  borderLeft: '3px solid var(--accent-cyan)',
                  wordBreak: 'break-all',
                }}
              >
                {cleanInput}
              </div>
            </div>

            {/* Encrypted Result */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--accent-green)',
                boxShadow: '0 0 15px var(--accent-green-glow)',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-green)', marginBottom: '6px' }}>
                ENCRYPTED CIPHERTEXT (SHIFT +{shiftKey})
              </div>
              <div
                style={{
                  background: 'var(--bg-main)',
                  padding: '12px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.9rem',
                  color: 'var(--text-code)',
                  borderLeft: '3px solid var(--accent-green)',
                  wordBreak: 'break-all',
                }}
              >
                {shiftEncryptedText}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          VIEW 2: TRANSPOSITION CIPHER VISUALIZATION
          ==================================================================== */}
      {activeCipherType === 'transposition' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Transposition Sub-mode & Matrix Dimension Controls */}
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
            {/* Sub-modes: Horizontal, Vertical, Diagonal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  PATH GEOMETRY:
                </span>
                <button
                  type="button"
                  className={`btn-cyber ${transMode === 'vertical' ? '' : 'btn-cyber-cyan'}`}
                  onClick={() => setTransMode('vertical')}
                  style={{
                    background: transMode === 'vertical' ? 'var(--accent-green)' : 'transparent',
                    color: transMode === 'vertical' ? 'var(--bg-main)' : 'var(--accent-cyan)',
                    borderColor: transMode === 'vertical' ? 'var(--accent-green)' : 'var(--border-color)',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
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
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                  }}
                >
                  [2. HORIZONTAL (SNAKE)]
                </button>
                <button
                  type="button"
                  className={`btn-cyber ${transMode === 'diagonal' ? '' : 'btn-cyber-cyan'}`}
                  onClick={() => setTransMode('diagonal')}
                  style={{
                    background: transMode === 'diagonal' ? 'var(--accent-green)' : 'transparent',
                    color: transMode === 'diagonal' ? 'var(--bg-main)' : 'var(--accent-cyan)',
                    borderColor: transMode === 'diagonal' ? 'var(--accent-green)' : 'var(--border-color)',
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                  }}
                >
                  [3. DIAGONAL (RAIL-FENCE)]
                </button>
              </div>

              {/* Matrix Dimensions Slider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
                  {transMode === 'diagonal' ? `RAILS (DEPTH): ${railRows}` : `COLUMNS: ${matrixCols}`}
                </span>
                {transMode === 'diagonal' ? (
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={railRows}
                    onChange={(e) => setRailRows(Number(e.target.value))}
                    style={{ width: '100px', accentColor: 'var(--accent-amber)', cursor: 'pointer' }}
                  />
                ) : (
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={matrixCols}
                    onChange={(e) => setMatrixCols(Number(e.target.value))}
                    style={{ width: '100px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
                  />
                )}
              </div>
            </div>

            {/* Animation Step Player Controls */}
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

              {/* Step Counter Indicator */}
              <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>
                <span style={{ color: 'var(--text-muted)' }}>STEP: </span>
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

          {/* Matrix 2D Character Grid View */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '20px',
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                &gt; DYNAMIC 2D MATRIX GRID VIEW ({transpositionData.rows} ROWS × {transpositionData.cols} COLS)
              </span>
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

            {/* Matrix Table */}
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
                <thead>
                  <tr>
                    <th style={{ color: 'var(--text-muted)', fontSize: '0.7rem', padding: '4px' }}>R \ C</th>
                    {Array.from({ length: transpositionData.cols }).map((_, cIdx) => (
                      <th
                        key={cIdx}
                        style={{
                          color: activeStepObj?.col === cIdx ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '4px 8px',
                          borderBottom: activeStepObj?.col === cIdx ? '2px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                        }}
                      >
                        #{cIdx + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
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
                        #{rIdx + 1}
                      </td>
                      {rowArr.map((cellChar, cIdx) => {
                        // Check if this cell is currently active
                        const isActive = activeStepObj?.row === rIdx && activeStepObj?.col === cIdx;

                        // Check if this cell was already visited in previous steps
                        const stepIndexForCell = transpositionData.steps.findIndex(
                          (s) => s.row === rIdx && s.col === cIdx
                        );
                        const isVisited = stepIndexForCell !== -1 && stepIndexForCell <= currentStep;
                        const isBlank = cellChar === '' || cellChar === undefined;

                        return (
                          <td
                            key={cIdx}
                            style={{
                              width: '42px',
                              height: '42px',
                              textAlign: 'center',
                              verticalAlign: 'middle',
                              fontFamily: 'var(--font-mono)',
                              fontSize: '1rem',
                              fontWeight: 'bold',
                              color: isBlank
                                ? 'transparent'
                                : isActive
                                ? 'var(--bg-main)'
                                : isVisited
                                ? 'var(--accent-green)'
                                : 'var(--text-main)',
                              background: isBlank
                                ? 'rgba(255, 255, 255, 0.02)'
                                : isActive
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

          {/* Extraction Stream Progress */}
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
                &gt; REAL-TIME EXTRACTION STREAM (CIPHERTEXT ACCUMULATION):
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
              <strong>Trajectory Logic: </strong>
              {transMode === 'vertical' && (
                <span>Characters were loaded row-by-row into {matrixCols} columns, then read out column-by-column (top to bottom).</span>
              )}
              {transMode === 'horizontal' && (
                <span>Characters were loaded into {matrixCols} columns, then extracted via alternating serpentine snake trajectory.</span>
              )}
              {transMode === 'diagonal' && (
                <span>Characters were placed along a {railRows}-rail diagonal zigzag trajectory, then read horizontally across each rail.</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
