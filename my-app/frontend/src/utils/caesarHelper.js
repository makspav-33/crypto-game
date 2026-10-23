// Alphabet definitions
export const EN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const UA_ALPHABET = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ';

/**
 * Perform Caesar decryption (shift backwards by key)
 */
export function decryptCaesar(ciphertext, key, lang = 'en') {
  if (!ciphertext) return '';
  const alphabet = lang === 'ua' ? UA_ALPHABET : EN_ALPHABET;
  const lowerAlphabet = alphabet.toLowerCase();
  const n = alphabet.length;
  const shift = ((key % n) + n) % n;

  return ciphertext
    .split('')
    .map((char) => {
      const upperIdx = alphabet.indexOf(char);
      if (upperIdx !== -1) {
        return alphabet[(upperIdx - shift + n) % n];
      }
      const lowerIdx = lowerAlphabet.indexOf(char);
      if (lowerIdx !== -1) {
        return lowerAlphabet[(lowerIdx - shift + n) % n];
      }
      return char;
    })
    .join('');
}

/**
 * Calculate frequency (%) for each character in text based on chosen alphabet.
 */
export function calculateTextFrequencies(text, lang = 'en') {
  const alphabet = lang === 'ua' ? UA_ALPHABET : EN_ALPHABET;
  const counts = {};
  for (let ch of alphabet) {
    counts[ch] = 0;
  }

  let totalLetters = 0;
  const upperText = (text || '').toUpperCase();

  for (let ch of upperText) {
    if (counts.hasOwnProperty(ch)) {
      counts[ch]++;
      totalLetters++;
    }
  }

  const frequencies = {};
  for (let ch of alphabet) {
    frequencies[ch] = totalLetters > 0 ? Number(((counts[ch] / totalLetters) * 100).toFixed(2)) : 0;
  }

  return frequencies;
}
