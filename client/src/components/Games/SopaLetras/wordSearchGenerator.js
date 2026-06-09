// Word-search (sopa de letras) grid generator.
// Keeps special characters (accents, apostrophes) intact — uppercases and
// strips spaces only. Random fill is drawn from the alphabet present in the
// placed words, so the noise letters look native to the language.

// 8 directions, including reversed ones (HARD/all-directions mode).
export const ALL_DIRECTIONS = [
    { dx: 1, dy: 0 },   // →
    { dx: -1, dy: 0 },  // ←
    { dx: 0, dy: 1 },   // ↓
    { dx: 0, dy: -1 },  // ↑
    { dx: 1, dy: 1 },   // ↘
    { dx: -1, dy: -1 }, // ↖
    { dx: 1, dy: -1 },  // ↗
    { dx: -1, dy: 1 },  // ↙
];

const GRID_BY_DIFFICULTY = { EASY: 10, MEDIUM: 12, HARD: 14 };

export const getGridSize = (difficulty, longestWord) => {
    const base = GRID_BY_DIFFICULTY[String(difficulty).toUpperCase()] ?? GRID_BY_DIFFICULTY.MEDIUM;
    // Grid must always be able to hold the longest word.
    return Math.max(base, longestWord + 1);
};

// Normalize a raw word to its grid form: uppercase, no spaces. Accents/'ʼ kept.
export const normalizeWord = (raw) => (raw || '').toUpperCase().replace(/\s+/g, '');

const randInt = (n) => Math.floor(Math.random() * n);

const tryPlace = (grid, size, letters, dir, row, col) => {
    // Check fit + compatible overlaps.
    for (let i = 0; i < letters.length; i++) {
        const r = row + dir.dy * i;
        const c = col + dir.dx * i;
        if (r < 0 || c < 0 || r >= size || c >= size) return false;
        const cur = grid[r][c];
        if (cur !== null && cur !== letters[i]) return false;
    }
    // Commit.
    const cells = [];
    for (let i = 0; i < letters.length; i++) {
        const r = row + dir.dy * i;
        const c = col + dir.dx * i;
        grid[r][c] = letters[i];
        cells.push({ r, c });
    }
    return cells;
};

const placeWord = (grid, size, letters, maxAttempts = 200) => {
    for (let a = 0; a < maxAttempts; a++) {
        const dir = ALL_DIRECTIONS[randInt(ALL_DIRECTIONS.length)];
        const row = randInt(size);
        const col = randInt(size);
        const cells = tryPlace(grid, size, letters, dir, row, col);
        if (cells) return cells;
    }
    return null;
};

/**
 * Generate a word-search board.
 * @param {Array<{id, text}>} entries  — words to hide (text already chosen: mazahua/spanish)
 * @param {string} difficulty          — EASY | MEDIUM | HARD
 * @returns {{ size, grid:string[][], placements:Array<{id,text,letters,cells}>, unplaced:Array }}
 */
export const generateWordSearch = (entries, difficulty) => {
    const prepared = entries
        .map(e => ({ ...e, letters: [...normalizeWord(e.text)] }))
        .filter(e => e.letters.length > 0)
        // longest first → better packing
        .sort((a, b) => b.letters.length - a.letters.length);

    const longest = prepared.length ? prepared[0].letters.length : 0;

    // Alphabet for random fill = every distinct char across all words.
    const alphabet = [...new Set(prepared.flatMap(e => e.letters))];
    const fillAlphabet = alphabet.length ? alphabet : ['A', 'E', 'I', 'O', 'U'];

    // Retry whole layout, growing the grid if some word can't be placed.
    let size = getGridSize(difficulty, longest);
    for (let attempt = 0; attempt < 6; attempt++) {
        const grid = Array.from({ length: size }, () => Array(size).fill(null));
        const placements = [];
        const unplaced = [];

        for (const e of prepared) {
            const cells = placeWord(grid, size, e.letters);
            if (cells) placements.push({ id: e.id, text: e.text, letters: e.letters, cells });
            else unplaced.push(e);
        }

        if (unplaced.length === 0 || attempt === 5) {
            // Fill the blanks with native-looking noise.
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (grid[r][c] === null) grid[r][c] = fillAlphabet[randInt(fillAlphabet.length)];
                }
            }
            return { size, grid, placements, unplaced };
        }
        size += 1; // grow and retry
    }
    return { size, grid: [], placements: [], unplaced: prepared };
};
