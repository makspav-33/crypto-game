import React, { useState, useEffect } from 'react';

/**
 * Cyberpunk Terminal Typing Effect.
 * Types text character by character with configurable speed and cursor.
 */
export default function TypingText({ text, speed = 25, delay = 150, onComplete, className = '' }) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let timeoutId;
    let index = 0;
    setDisplayedText('');
    setIsTyping(true);

    const startTimeout = setTimeout(() => {
      const intervalId = setInterval(() => {
        if (index < text.length) {
          setDisplayedText(text.slice(0, index + 1));
          index++;
        } else {
          clearInterval(intervalId);
          setIsTyping(false);
          if (onComplete) onComplete();
        }
      }, speed);

      return () => clearInterval(intervalId);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
    };
  }, [text, speed, delay, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {isTyping && <span className="cursor-blink" aria-hidden="true" />}
    </span>
  );
}
