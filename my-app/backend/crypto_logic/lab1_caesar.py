# -*- coding: utf-8 -*-
"""
Contract #1: Frequency Analysis & Legacy Ciphers (Lab 1)
Crypto logic module providing Caesar cipher encryption/decryption,
letter frequency calculation, and reference linguistic tables for UA and EN.
"""

from collections import Counter

# Alphabet Definitions
EN_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
EN_LOWER = "abcdefghijklmnopqrstuvwxyz"

UA_UPPER = "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ"
UA_LOWER = "абвгґдеєжзиіїйклмнопрстуфхцчшщьюя"

# Reference Frequencies (%) for English Language
EN_REFERENCE_FREQ = {
    'E': 12.70, 'T': 9.06, 'A': 8.17, 'O': 7.51, 'I': 6.97,
    'N': 6.75, 'S': 6.33, 'H': 6.09, 'R': 5.99, 'D': 4.25,
    'L': 4.03, 'C': 2.78, 'U': 2.76, 'M': 2.41, 'W': 2.36,
    'F': 2.23, 'G': 2.02, 'Y': 1.97, 'P': 1.93, 'B': 1.29,
    'V': 0.98, 'K': 0.77, 'J': 0.15, 'X': 0.15, 'Q': 0.10,
    'Z': 0.07
}

# Reference Frequencies (%) for Ukrainian Language
UA_REFERENCE_FREQ = {
    'О': 9.28, 'А': 7.22, 'І': 5.51, 'И': 5.38, 'Е': 4.79,
    'Н': 6.42, 'В': 5.05, 'Т': 4.77, 'Р': 4.60, 'С': 4.34,
    'К': 3.86, 'Л': 3.51, 'М': 3.11, 'Д': 3.06, 'П': 2.84,
    'У': 2.68, 'Я': 2.16, 'З': 2.07, 'Б': 1.74, 'Г': 1.63,
    'Ч': 1.40, 'Й': 1.24, 'Ь': 1.19, 'Х': 1.17, 'Ж': 0.94,
    'Ц': 0.61, 'Ш': 0.55, 'Ю': 0.48, 'Є': 0.40, 'Ї': 0.40,
    'Щ': 0.32, 'Ф': 0.11, 'Ґ': 0.01
}


def get_alphabet(lang: str = 'en'):
    """Return upper and lower case alphabets for specified language."""
    if lang.lower() in ('ua', 'uk', 'ukr', 'ukrainian'):
        return UA_UPPER, UA_LOWER
    return EN_UPPER, EN_LOWER


def caesar_encrypt(text: str, key: int, lang: str = 'en') -> str:
    """Encrypt plain text with Caesar cipher given a shift key."""
    upper_alpha, lower_alpha = get_alphabet(lang)
    n = len(upper_alpha)
    effective_key = key % n

    result = []
    for ch in text:
        if ch in upper_alpha:
            idx = upper_alpha.index(ch)
            result.append(upper_alpha[(idx + effective_key) % n])
        elif ch in lower_alpha:
            idx = lower_alpha.index(ch)
            result.append(lower_alpha[(idx + effective_key) % n])
        else:
            result.append(ch)
    return ''.join(result)


def caesar_decrypt(text: str, key: int, lang: str = 'en') -> str:
    """Decrypt cipher text with Caesar cipher given candidate key."""
    upper_alpha, lower_alpha = get_alphabet(lang)
    n = len(upper_alpha)
    effective_key = key % n

    result = []
    for ch in text:
        if ch in upper_alpha:
            idx = upper_alpha.index(ch)
            result.append(upper_alpha[(idx - effective_key) % n])
        elif ch in lower_alpha:
            idx = lower_alpha.index(ch)
            result.append(lower_alpha[(idx - effective_key) % n])
        else:
            result.append(ch)
    return ''.join(result)


def calculate_frequencies(text: str, lang: str = 'en') -> dict:
    """
    Calculate letter frequencies (%) in given text for each character
    in the chosen alphabet. Returns dict with percentages.
    """
    upper_alpha, lower_alpha = get_alphabet(lang)
    char_counts = Counter()
    total_letters = 0

    # Count letters (case-insensitive, normalized to uppercase)
    for ch in text:
        if ch in upper_alpha:
            char_counts[ch] += 1
            total_letters += 1
        elif ch in lower_alpha:
            norm_ch = upper_alpha[lower_alpha.index(ch)]
            char_counts[norm_ch] += 1
            total_letters += 1

    frequencies = {}
    for letter in upper_alpha:
        if total_letters > 0:
            count = char_counts.get(letter, 0)
            frequencies[letter] = round((count / total_letters) * 100, 2)
        else:
            frequencies[letter] = 0.0

    return frequencies


# Standard Contract Tasks
CONTRACT_TASKS = {
    'en_corp_intercept': {
        'id': 'en_corp_intercept',
        'name': 'Corporate Nexus Intercept',
        'lang': 'en',
        'key': 7,
        'plaintext': (
            'HACKNET AGENT MISSION CONFIRMED. THE CORPORATE NEXUS MAINFRAME HAS BEEN '
            'SUCCESSFULLY COMPROMISED. EXTRACT ALL ENCRYPTED ASSETS BEFORE SYSTEM LOCKDOWN.'
        ),
        'difficulty': 'EASY',
        'reward': 1500,
        'description': (
            'Intercepted corporate transmission between rival security executives. '
            'Caesar cipher applied with single-digit shift.'
        )
    },
    'ua_syndicate_leak': {
        'id': 'ua_syndicate_leak',
        'name': 'DarkWeb Syndicate Protocol',
        'lang': 'ua',
        'key': 11,
        'plaintext': (
            'ПЕРЕХОПЛЕНО ЗАСЕКРЕЧЕНЕ ЛИСТУВАННЯ СИНДИКАТУ. КЛЮЧІ ВІД ЗАХИЩЕНОГО '
            'СХОВИЩА ТЕПЕР У ВАШИХ РУКАХ. ОЧІКУЙТЕ НАСТУПНИХ ВКАЗІВОК.'
        ),
        'difficulty': 'MEDIUM',
        'reward': 1500,
        'description': (
            'Ukrainian darknet syndicate communication intercepted via Tor relay. '
            '33-letter Ukrainian Caesar alphabet shift.'
        )
    }
}

# Pre-generate ciphertexts
for task_id, task in CONTRACT_TASKS.items():
    task['ciphertext'] = caesar_encrypt(task['plaintext'], task['key'], task['lang'])


def verify_decryption(submitted_text: str, submitted_key: int, task_id: str = None) -> tuple:
    """
    Validate if submitted decryption text and/or key matches expected contract target.
    Returns (is_valid: bool, matched_task_id: str or None).
    """
    clean_submitted = (submitted_text or '').strip().upper()

    # If specific task was specified
    if task_id and task_id in CONTRACT_TASKS:
        task = CONTRACT_TASKS[task_id]
        expected_text = task['plaintext'].strip().upper()
        expected_key = task['key']

        # Valid if text matches target plaintext or key matches expected
        if clean_submitted == expected_text or int(submitted_key) == expected_key:
            return True, task_id
        return False, None

    # Check against all available tasks
    for tid, task in CONTRACT_TASKS.items():
        expected_text = task['plaintext'].strip().upper()
        expected_key = task['key']
        if clean_submitted == expected_text or int(submitted_key) == expected_key:
            return True, tid

    return False, None
