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


def untranspose_cipher(ciphertext: str, mode: str = "vertical", key: str = "KEY"):
    """
    Decrypt keyed transposition cipher.
    Reconstructs the original 2D matrix from ciphertext, then reads row-by-row.
    Returns matrix, step-by-step fill sequence, and recovered plaintext.
    """
    clean_ct = ciphertext if ciphertext else ""
    clean_key, col_order, ranks = get_key_order(key)
    cols = len(clean_key)
    length = len(clean_ct)
    rows = max(1, math.ceil(length / cols))

    # Full cells vs padded cells (last row may be short)
    full_cols = length % cols  # how many cols in the last row have a real char
    if full_cols == 0:
        full_cols = cols        # all columns are full

    # step_num counter shared across phases
    step_num = 0

    if mode == "vertical":
        # Invert: ciphertext was read col-by-col in col_order.
        # Now pour back col-by-col in the same order.
        matrix = [["" for _ in range(cols)] for _ in range(rows)]
        fill_steps = []
        idx = 0
        for order_rank, c in enumerate(col_order):
            key_letter = clean_key[c]
            rank = ranks[c]
            # Determine how many rows this column holds
            col_rows = rows if (order_rank < full_cols or full_cols == cols) else rows - 1
            for r in range(col_rows):
                if idx < length:
                    ch = clean_ct[idx]
                    matrix[r][c] = ch
                    fill_steps.append({
                        "step": step_num, "row": r, "col": c,
                        "char": ch, "key_letter": key_letter, "rank": rank,
                        "phase": "fill",
                        "path_desc": f"Fill Col #{c+1} [Key '{key_letter}' Rank #{rank}] Row #{r+1} ← '{ch}'"
                    })
                    step_num += 1
                    idx += 1

        # Read row-by-row to recover plaintext
        read_steps = []
        plaintext_chars = []
        for r in range(rows):
            for c in range(cols):
                ch = matrix[r][c]
                if ch:
                    plaintext_chars.append(ch)
                    read_steps.append({
                        "step": step_num, "row": r, "col": c,
                        "char": ch, "key_letter": clean_key[c], "rank": ranks[c],
                        "phase": "read",
                        "path_desc": f"Read Row #{r+1} Col #{c+1} → '{ch}'"
                    })
                    step_num += 1

    elif mode == "horizontal":
        # Invert: ciphertext was read row-by-row with col permutation.
        # Pour back the same way, then read left-to-right.
        matrix = [["" for _ in range(cols)] for _ in range(rows)]
        fill_steps = []
        idx = 0
        for r in range(rows):
            for order_rank, c in enumerate(col_order):
                key_letter = clean_key[c]
                rank = ranks[c]
                if idx < length:
                    ch = clean_ct[idx]
                    matrix[r][c] = ch
                    fill_steps.append({
                        "step": step_num, "row": r, "col": c,
                        "char": ch, "key_letter": key_letter, "rank": rank,
                        "phase": "fill",
                        "path_desc": f"Fill Row #{r+1} [Key '{key_letter}' Rank #{rank}] Col #{c+1} ← '{ch}'"
                    })
                    step_num += 1
                    idx += 1

        read_steps = []
        plaintext_chars = []
        for r in range(rows):
            for c in range(cols):
                ch = matrix[r][c]
                if ch:
                    plaintext_chars.append(ch)
                    read_steps.append({
                        "step": step_num, "row": r, "col": c,
                        "char": ch, "key_letter": clean_key[c], "rank": ranks[c],
                        "phase": "read",
                        "path_desc": f"Read Row #{r+1} Col #{c+1} → '{ch}'"
                    })
                    step_num += 1

    else:  # diagonal
        # Invert: rebuild visited order, pour chars back, then read row-by-row.
        visited_order = []
        visited_set = set()
        for c_start in col_order:
            for r in range(rows):
                c = (c_start + r) % cols
                key = (r, c)
                if key not in visited_set:
                    visited_set.add(key)
                    visited_order.append((r, c, c_start))
        for r in range(rows):
            for c in range(cols):
                if (r, c) not in visited_set:
                    visited_set.add((r, c))
                    visited_order.append((r, c, c))

        matrix = [["" for _ in range(cols)] for _ in range(rows)]
        fill_steps = []
        for idx, (r, c, c_start) in enumerate(visited_order):
            if idx >= length:
                break
            ch = clean_ct[idx]
            key_letter = clean_key[c_start]
            rank = ranks[c_start]
            matrix[r][c] = ch
            fill_steps.append({
                "step": step_num, "row": r, "col": c,
                "char": ch, "key_letter": key_letter, "rank": rank,
                "phase": "fill",
                "path_desc": f"Fill Diagonal [Key '{key_letter}' Rank #{rank}] ({r+1},{c+1}) ← '{ch}'"
            })
            step_num += 1

        read_steps = []
        plaintext_chars = []
        for r in range(rows):
            for c in range(cols):
                ch = matrix[r][c]
                if ch:
                    plaintext_chars.append(ch)
                    read_steps.append({
                        "step": step_num, "row": r, "col": c,
                        "char": ch, "key_letter": clean_key[c], "rank": ranks[c],
                        "phase": "read",
                        "path_desc": f"Read Row #{r+1} Col #{c+1} → '{ch}'"
                    })
                    step_num += 1

    plaintext = "".join(plaintext_chars).replace("•", "").rstrip()
    all_steps = fill_steps + read_steps

    return {
        "ciphertext": clean_ct,
        "key": clean_key,
        "col_order": col_order,
        "ranks": ranks,
        "mode": mode,
        "rows": rows,
        "cols": cols,
        "matrix": matrix,
        "fill_steps": fill_steps,
        "read_steps": read_steps,
        "steps": all_steps,
        "plaintext": plaintext
    }
