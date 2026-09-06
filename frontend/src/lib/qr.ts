/**
 * Minimal dependency-free QR Code generator for Paaska.
 *
 * Scope: byte mode, error-correction level M, versions 1–6 (single
 * Reed–Solomon block), mask pattern 2. Payload capacity is 62 bytes —
 * plenty for install URLs and short shop slugs used by the Counter QR
 * Standee preview.
 *
 * The public surface is `qrEncode(text): QrCodeMatrix` — a row-major
 * boolean matrix (true = dark module) plus `qrToSvgPath()` which turns
 * it into a single crisp SVG path (1 module = 1 user unit).
 */

export interface QrCodeMatrix {
  /** Modules per side (4·version + 17 → 21…41 for v1…v6). */
  size: number;
  /** Row-major, length size². true = dark module. */
  modules: boolean[];
  get(row: number, col: number): boolean;
}

const MAX_VERSION = 6;
const EC_M_INDICATOR = 0b00; // EC level bits: L=01, M=00, Q=11, H=10
const MASK_PATTERN = 2;

/** Total / data codeword counts per version at EC level M. */
const TOTAL_CODEWORDS = [0, 26, 44, 70, 100, 134, 172];
const DATA_CODEWORDS = [0, 16, 28, 44, 64, 86, 108];

/**
 * RS block structure per version at EC level M (ISO 18004 table 9).
 * Versions 4–6 split data across multiple blocks which are encoded
 * separately and interleaved (data first, then parity, round-robin
 * across blocks).
 */
interface RsBlockSpec {
  numBlocks: number;
  dataCw: number;
  ecCw: number;
}
const BLOCKS_M: (RsBlockSpec | null)[] = [
  null, // v0 — unused
  { numBlocks: 1, dataCw: 16, ecCw: 10 }, // v1
  { numBlocks: 1, dataCw: 28, ecCw: 16 }, // v2
  { numBlocks: 1, dataCw: 44, ecCw: 26 }, // v3
  { numBlocks: 2, dataCw: 32, ecCw: 18 }, // v4
  { numBlocks: 2, dataCw: 43, ecCw: 24 }, // v5
  { numBlocks: 4, dataCw: 27, ecCw: 16 }, // v6
];

/* ------------------------------------------------------------------ */
/* Galois field GF(256), primitive polynomial 0x11D (x^8+x^4+x^3+x^2+1) */
/* ------------------------------------------------------------------ */

const GF_EXP: number[] = new Array(512).fill(0);
const GF_LOG: number[] = new Array(256).fill(0);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[GF_LOG[a] + GF_LOG[b]];
}

/* ----------------------------- Reed–Solomon ----------------------- */

/**
 * Generator polynomial of `degree` with roots α⁰…α^(degree-1), stored
 * high-to-low (index 0 = x^degree = 1).
 */
function rsGeneratorPolynomial(degree: number): number[] {
  let poly: number[] = [1];
  for (let i = 0; i < degree; i += 1) {
    const a = GF_EXP[i];
    const next: number[] = new Array(poly.length + 1).fill(0);
    for (let k = 0; k < poly.length; k += 1) {
      next[k] ^= poly[k]; // x · P(x)
      next[k + 1] ^= gfMul(poly[k], a); // α^i · P(x)
    }
    poly = next;
  }
  return poly;
}

/** `degree` error-correction codewords for the given data codewords. */
function reedSolomonEncode(data: number[], degree: number): number[] {
  const g = rsGeneratorPolynomial(degree);
  const buffer = data.concat(new Array<number>(degree).fill(0));
  for (let i = 0; i < data.length; i += 1) {
    const factor = buffer[i];
    if (factor === 0) continue;
    for (let j = 0; j <= degree; j += 1) {
      buffer[i + j] ^= gfMul(g[j], factor);
    }
  }
  return buffer.slice(data.length);
}

/* --------------------------- Bit assembly -------------------------- */

function pushBits(out: number[], value: number, count: number): void {
  for (let i = count - 1; i >= 0; i -= 1) out.push((value >>> i) & 1);
}

/**
 * Byte-mode payload bits, padded to exactly `dataBits` bits
 * (terminator + 0xEC/0x11 pad codewords).
 */
function buildDataBits(payload: number[], version: number): number[] {
  const dataBits = DATA_CODEWORDS[version] * 8;
  const bits: number[] = [];
  pushBits(bits, 0b0100, 4); // mode: byte
  pushBits(bits, payload.length, 8); // v1–9 byte mode → 8-bit count
  for (const byte of payload) pushBits(bits, byte, 8);

  // Terminator (max 4 zero bits) + pad to byte boundary.
  const terminator = Math.min(4, dataBits - bits.length);
  pushBits(bits, 0, terminator);
  while (bits.length % 8 !== 0) bits.push(0);

  // Pad codewords, alternating 0xEC / 0x11.
  const padBytes = [0xec, 0x11];
  let padIndex = 0;
  while (bits.length < dataBits) {
    pushBits(bits, padBytes[padIndex % 2], 8);
    padIndex += 1;
  }
  return bits;
}

/* --------------------------- Matrix build -------------------------- */

function finderMask(dy: number, dx: number): boolean {
  if (dy < 0 || dy > 6 || dx < 0 || dx > 6) return false;
  if (dy === 0 || dy === 6 || dx === 0 || dx === 6) return true;
  return dy >= 2 && dy <= 4 && dx >= 2 && dx <= 4;
}

/** Bit length of an integer (position of the highest set bit). */
function bchDigit(value: number): number {
  let digits = 0;
  while (value !== 0) {
    digits += 1;
    value >>>= 1;
  }
  return digits;
}

/** 15-bit format information (EC level + mask) with BCH(15,5) error bits. */
function formatInfoBits(): number {
  const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | 1;
  const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);
  const data = (EC_M_INDICATOR << 3) | MASK_PATTERN; // 5 bits
  let d = data << 10;
  while (bchDigit(d) - bchDigit(G15) >= 0) {
    d ^= G15 << (bchDigit(d) - bchDigit(G15));
  }
  return ((data << 10) | d) ^ G15_MASK;
}

function maskCondition(row: number, col: number): boolean {
  // Mask 2: column mod 3 === 0
  return col % 3 === 0;
}

export function qrEncode(text: string): QrCodeMatrix {
  const payload: number[] = [];
  // UTF-8 encode (TextEncoder-free fallback keeps this SSR-safe too).
  const normalized = String(text);
  for (let i = 0; i < normalized.length; i += 1) {
    let code = normalized.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < normalized.length) {
      const low = normalized.charCodeAt(i + 1);
      if (low >= 0xdc00 && low <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (low - 0xdc00);
        i += 1;
      }
    }
    if (code < 0x80) payload.push(code);
    else if (code < 0x800) payload.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    else payload.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
  }

  let version = 0;
  for (let v = 1; v <= MAX_VERSION; v += 1) {
    if (payload.length <= Math.floor((DATA_CODEWORDS[v] * 8 - 12) / 8)) {
      version = v;
      break;
    }
  }
  if (version === 0) {
    throw new Error(`QR payload exceeds ${Math.floor((DATA_CODEWORDS[MAX_VERSION] * 8 - 12) / 8)} bytes`);
  }

  const dataBits = buildDataBits(payload, version);
  const block = BLOCKS_M[version] as RsBlockSpec;
  const dataCodewords: number[] = new Array(DATA_CODEWORDS[version]).fill(0);
  for (let i = 0; i < dataCodewords.length; i += 1) {
    let byte = 0;
    for (let b = 0; b < 8; b += 1) byte = (byte << 1) | dataBits[i * 8 + b];
    dataCodewords[i] = byte;
  }

  // Split into RS blocks, encode each, interleave (data then parity,
  // round-robin across blocks — ISO 18004 §8.6.3).
  const dataBlocks: number[][] = [];
  for (let b = 0; b < block.numBlocks; b += 1) {
    dataBlocks.push(
      dataCodewords.slice(b * block.dataCw, (b + 1) * block.dataCw),
    );
  }
  const eccBlocks = dataBlocks.map((d) => reedSolomonEncode(d, block.ecCw));
  const allCodewords: number[] = [];
  for (let i = 0; i < block.dataCw; i += 1) {
    for (let b = 0; b < block.numBlocks; b += 1) allCodewords.push(dataBlocks[b][i]);
  }
  for (let i = 0; i < block.ecCw; i += 1) {
    for (let b = 0; b < block.numBlocks; b += 1) allCodewords.push(eccBlocks[b][i]);
  }

  const allBits: number[] = [];
  for (const cw of allCodewords) pushBits(allBits, cw, 8);

  const size = 4 * version + 17;
  const modules: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const isFunction: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));

  const setFn = (row: number, col: number, dark: boolean): void => {
    modules[row][col] = dark;
    isFunction[row][col] = true;
  };

  // Finder patterns + separators (8×8 footprint).
  const placeFinder = (top: number, left: number): void => {
    for (let dy = -1; dy <= 7; dy += 1) {
      for (let dx = -1; dx <= 7; dx += 1) {
        const r = top + dy;
        const c = left + dx;
        if (r < 0 || r >= size || c < 0 || c >= size) continue;
        setFn(r, c, finderMask(dy, dx));
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);

  // Timing patterns.
  for (let i = 8; i < size - 8; i += 1) {
    const dark = i % 2 === 0;
    setFn(6, i, dark);
    setFn(i, 6, dark);
  }

  // Alignment pattern — versions 2–6 carry exactly one, centred at
  // (4·version + 10, 4·version + 10) = (18,18) … (34,34).
  if (version >= 2) {
    const center = 4 * version + 10;
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        const ring = Math.max(Math.abs(dy), Math.abs(dx));
        setFn(center + dy, center + dx, ring !== 1);
      }
    }
  }

  // Reserve format-info regions (exact cells per ISO 18004; filled after
  // masking). Note (6,8) / (8,6) stay data — they belong to the timing
  // cross — and (size-8, 8) is the dark module, not format.
  for (const i of [0, 1, 2, 3, 4, 5, 7, 8]) {
    setFn(8, i, false);
    setFn(i, 8, false);
  }
  for (let i = 0; i < 8; i += 1) {
    setFn(8, size - 1 - i, false); // row 8, cols size-1 … size-8
  }
  for (let i = 0; i < 7; i += 1) {
    setFn(size - 7 + i, 8, false); // col 8, rows size-7 … size-1
  }

  // Dark module.
  setFn(size - 8, 8, true);

  // Data placement — zigzag up the right-hand column pairs, skipping
  // the timing column; leftover slots are filled with zero bits.
  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert += 1) {
      for (let j = 0; j < 2; j += 1) {
        const col = right - j;
        const upward = ((right + 1) & 2) === 0;
        const row = upward ? size - 1 - vert : vert;
        if (isFunction[row][col]) continue;
        const bit = bitIndex < allBits.length ? allBits[bitIndex] : 0;
        modules[row][col] = bit === 1;
        if (bitIndex < allBits.length) bitIndex += 1;
      }
    }
  }

  // Mask (applied to non-function modules only).
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!isFunction[row][col] && maskCondition(row, col)) modules[row][col] = !modules[row][col];
    }
  }

  // Format info (two copies, per ISO 18004 placement).
  const fmt = formatInfoBits();
  for (let i = 0; i < 15; i += 1) {
    const mod = ((fmt >>> i) & 1) === 1;
    // Vertical: col 8 — rows 0..5, then 7..8, then size-7..size-1.
    if (i < 6) setFn(i, 8, mod);
    else if (i < 8) setFn(i + 1, 8, mod);
    else setFn(size - 15 + i, 8, mod);
    // Horizontal: row 8 — cols size-1..size-8, then 7, then 5..0.
    if (i < 8) setFn(8, size - i - 1, mod);
    else if (i < 9) setFn(8, 7, mod);
    else setFn(8, 14 - i, mod);
  }

  const flat: boolean[] = new Array(size * size);
  for (let r = 0; r < size; r += 1) for (let c = 0; c < size; c += 1) flat[r * size + c] = modules[r][c];

  return {
    size,
    modules: flat,
    get: (row: number, col: number) => modules[row][col],
  };
}

/**
 * Single SVG path for the dark modules (1 module = 1 unit). Render with
 * `viewBox="0 0 {size} {size}"` over a light background for a quiet zone.
 */
export function qrToSvgPath(matrix: QrCodeMatrix): string {
  const parts: string[] = [];
  const { size, modules } = matrix;
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (modules[row * size + col]) parts.push(`M${col} ${row}h1v1h-1z`);
    }
  }
  return parts.join('');
}
