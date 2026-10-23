# -*- coding: utf-8 -*-
"""
Transposition Cipher helper module for Cipher Lab / Sandbox.
Supports Vertical (Columnar), Horizontal (Snake/Boustrophedon), and Diagonal (Rail-Fence) transpositions.
"""
import math


def transpose_cipher(text: str, mode: str = "vertical", cols: int = 5):
    """
    Generate 2D matrix, step-by-step traversal path, and resulting ciphertext.
    """
    clean_text = text if text else "HACKNET PROTOCOL CIPHER LAB"
    length = len(clean_text)
    cols = max(2, min(cols, 12))
    rows = math.ceil(length / cols)

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
                row.append(" ")  # Padding space
        matrix.append(row)

    steps = []
    ciphertext_chars = []

    if mode == "vertical":
        # Columnar: read column-by-column (top to bottom)
        step_num = 0
        for c in range(cols):
            for r in range(rows):
                ch = matrix[r][c]
                ciphertext_chars.append(ch)
                steps.append({
                    "step": step_num,
                    "row": r,
                    "col": c,
                    "char": ch,
                    "direction": "down"
                })
                step_num += 1

    elif mode == "horizontal":
        # Snake / Boustrophedon horizontal transposition:
        # even rows L->R, odd rows R->L
        step_num = 0
        for r in range(rows):
            col_range = range(cols) if r % 2 == 0 else range(cols - 1, -1, -1)
            for c in col_range:
                ch = matrix[r][c]
                ciphertext_chars.append(ch)
                steps.append({
                    "step": step_num,
                    "row": r,
                    "col": c,
                    "char": ch,
                    "direction": "right" if r % 2 == 0 else "left"
                })
                step_num += 1

    elif mode == "diagonal":
        # Diagonal / Rail-fence zigzag traversal across rows
        # Place characters in zigzag path across rails (rows)
        rail_matrix = [["" for _ in range(length)] for _ in range(rows)]
        cur_row = 0
        going_down = False

        for i in range(length):
            rail_matrix[cur_row][i] = clean_text[i]
            if cur_row == 0 or cur_row == rows - 1:
                going_down = not going_down
            cur_row += 1 if going_down else -1

        # Read row by row across columns
        step_num = 0
        matrix = rail_matrix  # Use rail matrix for diagonal display
        cols = length
        for r in range(rows):
            for c in range(length):
                ch = rail_matrix[r][c]
                if ch != "":
                    ciphertext_chars.append(ch)
                    steps.append({
                        "step": step_num,
                        "row": r,
                        "col": c,
                        "char": ch,
                        "direction": "diagonal"
                    })
                    step_num += 1

    ciphertext = "".join(ciphertext_chars)

    return {
        "text": clean_text,
        "mode": mode,
        "rows": rows,
        "cols": cols,
        "matrix": matrix,
        "steps": steps,
        "ciphertext": ciphertext
    }
