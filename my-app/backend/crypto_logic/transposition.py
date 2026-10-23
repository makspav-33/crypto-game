# -*- coding: utf-8 -*-
"""
Key-based Transposition Cipher helper module for Cipher Lab / Sandbox.
Supports Vertical (Columnar), Horizontal (Row-Permuted), and Diagonal (Key-Guided Diagonal) transpositions.
"""
import math


def get_key_order(key: str):
    """
    Calculate column order and 1-based ranks from user key.
    Example: key 'CAB' -> col_order [1, 2, 0], ranks [3, 1, 2].
    """
    clean_key = ''.join([c for c in (key or 'KEY').upper() if c.isalnum()])
    if not clean_key:
        clean_key = 'KEY'

    # Pair with original index and sort alphabetically (stable sort for ties)
    indexed = [(c, i) for i, c in enumerate(clean_key)]
    sorted_pairs = sorted(indexed, key=lambda x: x[0])

    col_order = [p[1] for p in sorted_pairs]
    ranks = [0] * len(clean_key)
    for rank_idx, (c, orig_idx) in enumerate(sorted_pairs):
        ranks[orig_idx] = rank_idx + 1

    return clean_key, col_order, ranks


def transpose_cipher(text: str, mode: str = "vertical", key: str = "KEY", cols: int = None):
    """
    Generate 2D matrix, step-by-step traversal path, and resulting ciphertext based on user text key.
    """
    clean_text = text if text else "HACKNET PROTOCOL CIPHER LAB"
    clean_key, col_order, ranks = get_key_order(key)
    cols = len(clean_key)
    length = len(clean_text)
    rows = max(1, math.ceil(length / cols))

    # 1. Fill 2D Matrix (row by row)
    matrix = []
    char_idx = 0
    for r in range(rows):
        row = []
        for c in range(cols):
            if char_idx < length:
                row.append(clean_text[char_idx])
                char_idx += 1
            else:
                row.append("•")  # Padding marker
        matrix.append(row)

    steps = []
    ciphertext_chars = []
    step_num = 0

    if mode == "vertical":
        # Keyed Columnar: Read column-by-column in order of key ranks
        for order_idx, c in enumerate(col_order):
            key_letter = clean_key[c]
            rank = ranks[c]
            for r in range(rows):
                ch = matrix[r][c]
                ciphertext_chars.append(ch)
                steps.append({
                    "step": step_num,
                    "row": r,
                    "col": c,
                    "char": ch,
                    "key_letter": key_letter,
                    "rank": rank,
                    "direction": "down",
                    "path_desc": f"Key '{key_letter}' (Rank #{rank}) ➔ Col #{c + 1}, Row #{r + 1}"
                })
                step_num += 1

    elif mode == "horizontal":
        # Key-Permuted Horizontal: In each row, extract characters in order of key ranks
        for r in range(rows):
            for c in col_order:
                key_letter = clean_key[c]
                rank = ranks[c]
                ch = matrix[r][c]
                ciphertext_chars.append(ch)
                steps.append({
                    "step": step_num,
                    "row": r,
                    "col": c,
                    "char": ch,
                    "key_letter": key_letter,
                    "rank": rank,
                    "direction": "horizontal",
                    "path_desc": f"Row #{r + 1} ➔ Key '{key_letter}' (Rank #{rank}) at Col #{c + 1}"
                })
                step_num += 1

    elif mode == "diagonal":
        # Key-Guided Diagonal Transposition:
        # Traverse diagonals initiated from columns ordered by key rank
        visited = set()
        for c_start in col_order:
            key_letter = clean_key[c_start]
            rank = ranks[c_start]
            for r in range(rows):
                c = (c_start + r) % cols
                if (r, c) not in visited:
                    visited.add((r, c))
                    ch = matrix[r][c]
                    ciphertext_chars.append(ch)
                    steps.append({
                        "step": step_num,
                        "row": r,
                        "col": c,
                        "char": ch,
                        "key_letter": key_letter,
                        "rank": rank,
                        "direction": "diagonal",
                        "path_desc": f"Diagonal [Key '{key_letter}' #{rank}] ➔ ({r + 1}, {c + 1})"
                    })
                    step_num += 1

        # Catch any remaining cells
        for r in range(rows):
            for c in range(cols):
                if (r, c) not in visited:
                    visited.add((r, c))
                    ch = matrix[r][c]
                    ciphertext_chars.append(ch)
                    steps.append({
                        "step": step_num,
                        "row": r,
                        "col": c,
                        "char": ch,
                        "key_letter": clean_key[c],
                        "rank": ranks[c],
                        "direction": "diagonal",
                        "path_desc": f"Diagonal residual ➔ ({r + 1}, {c + 1})"
                    })
                    step_num += 1

    ciphertext = "".join(ciphertext_chars)

    return {
        "text": clean_text,
        "key": clean_key,
        "col_order": col_order,
        "ranks": ranks,
        "mode": mode,
        "rows": rows,
        "cols": cols,
        "matrix": matrix,
        "steps": steps,
        "ciphertext": ciphertext
    }
