// Alphabet definitions
export const EN_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const UA_ALPHABET = 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ';

// Reference Frequencies (%) for English Language
export const EN_REFERENCE_FREQ = {
  'E': 12.70, 'T': 9.06, 'A': 8.17, 'O': 7.51, 'I': 6.97,
  'N': 6.75, 'S': 6.33, 'H': 6.09, 'R': 5.99, 'D': 4.25,
  'L': 4.03, 'C': 2.78, 'U': 2.76, 'M': 2.41, 'W': 2.36,
  'F': 2.23, 'G': 2.02, 'Y': 1.97, 'P': 1.93, 'B': 1.29,
  'V': 0.98, 'K': 0.77, 'J': 0.15, 'X': 0.15, 'Q': 0.10,
  'Z': 0.07,
};

// Reference Frequencies (%) for Ukrainian Language
export const UA_REFERENCE_FREQ = {
  'О': 9.28, 'А': 7.22, 'І': 5.51, 'И': 5.38, 'Е': 4.79,
  'Н': 6.42, 'В': 5.05, 'Т': 4.77, 'Р': 4.60, 'С': 4.34,
  'К': 3.86, 'Л': 3.51, 'М': 3.11, 'Д': 3.06, 'П': 2.84,
  'У': 2.68, 'Я': 2.16, 'З': 2.07, 'Б': 1.74, 'Г': 1.63,
  'Ч': 1.40, 'Й': 1.24, 'Ь': 1.19, 'Х': 1.17, 'Ж': 0.94,
  'Ц': 0.61, 'Ш': 0.55, 'Ю': 0.48, 'Є': 0.40, 'Ї': 0.40,
  'Щ': 0.32, 'Ф': 0.11, 'Ґ': 0.01,
};

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
 * Perform Caesar encryption (shift forward by key)
 */
export function encryptCaesar(plaintext, key, lang = 'en') {
  if (!plaintext) return '';
  const alphabet = lang === 'ua' ? UA_ALPHABET : EN_ALPHABET;
  const lowerAlphabet = alphabet.toLowerCase();
  const n = alphabet.length;
  const shift = ((key % n) + n) % n;

  return plaintext
    .split('')
    .map((char) => {
      const upperIdx = alphabet.indexOf(char);
      if (upperIdx !== -1) {
        return alphabet[(upperIdx + shift) % n];
      }
      const lowerIdx = lowerAlphabet.indexOf(char);
      if (lowerIdx !== -1) {
        return lowerAlphabet[(lowerIdx + shift) % n];
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

/**
 * Key-based column ordering helper.
 * Returns { cleanKey, colOrder, ranks }
 * Example: 'CAB' -> colOrder: [1, 2, 0], ranks: [3, 1, 2]
 */
export function getKeyOrder(key) {
  const cleanKey = (key || 'KEY').toUpperCase().replace(/[^A-Z0-9А-ЯҐЄІЇ]/g, '') || 'KEY';
  const indexed = cleanKey.split('').map((char, index) => ({ char, index }));
  
  // Stable alphabetical sort
  const sorted = [...indexed].sort((a, b) => a.char.localeCompare(b.char));

  const colOrder = sorted.map((item) => item.index);
  const ranks = new Array(cleanKey.length);
  sorted.forEach((item, rankIdx) => {
    ranks[item.index] = rankIdx + 1;
  });

  return { cleanKey, colOrder, ranks };
}
