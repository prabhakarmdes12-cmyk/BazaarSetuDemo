/**
 * Paaska demo catalog — a small, hand-curated slice of the Bighi Brothers
 * Mart shelf used by the landing page's Voice Parchi Sandbox.
 *
 * The sandbox matches shopper speech (Web Speech transcript or the preset
 * chips) against Hinglish aliases and produces an instant sample cart,
 * exactly like the full in-app experience would.
 */

export interface DemoProduct {
  id: string;
  name: string;
  /** Hinglish/English words that map to this product. */
  aliases: string[];
  unit: string;
  unitLabel: string;
  price: number;
  emoji: string;
  category: 'dairy' | 'sabzi' | 'apna' | 'snacks' | 'essential';
  /** Default quantity when the shopper says nothing explicit. */
  defaultQty: number;
}

export const DEMO_CATALOG: DemoProduct[] = [
  {
    id: 'amul-taza-milk-500ml',
    name: 'Amul Taza Milk',
    aliases: ['amul milk', 'amul', 'milk', 'doodh', 'taza doodh', 'taza milk'],
    unit: 'packet',
    unitLabel: '500 ml',
    price: 28,
    emoji: '🥛',
    category: 'dairy',
    defaultQty: 1,
  },
  {
    id: 'amul-butter-100g',
    name: 'Amul Butter',
    aliases: ['amul butter', 'butter', 'makhan'],
    unit: 'pack',
    unitLabel: '100 g',
    price: 60,
    emoji: '🧈',
    category: 'dairy',
    defaultQty: 1,
  },
  {
    id: 'bread-white',
    name: 'White Bread',
    aliases: ['bread', 'brown bread', 'bread loaf'],
    unit: 'packet',
    unitLabel: '400 g',
    price: 45,
    emoji: '🍞',
    category: 'dairy',
    defaultQty: 1,
  },
  {
    id: 'pyaaz',
    name: 'Pyaaz (Onion)',
    aliases: ['pyaaz', 'pyaz', 'onion', 'pyaaz 1kg'],
    unit: 'kg',
    unitLabel: 'per kg',
    price: 38,
    emoji: '🧅',
    category: 'sabzi',
    defaultQty: 1,
  },
  {
    id: 'tamatar',
    name: 'Tamatar (Tomato)',
    aliases: ['tamatar', 'tomato', 'tamatar 1kg'],
    unit: 'kg',
    unitLabel: 'per kg',
    price: 42,
    emoji: '🍅',
    category: 'sabzi',
    defaultQty: 1,
  },
  {
    id: 'fortune-soya-oil',
    name: 'Fortune Soyabean Oil',
    aliases: ['fortune tel', 'fortune', 'soya tel', 'soyabean oil', 'tel', 'oil', 'suraj murli'],
    unit: 'litre',
    unitLabel: '1 L',
    price: 132,
    emoji: '🫗',
    category: 'apna',
    defaultQty: 1,
  },
  {
    id: 'toor-daal',
    name: 'Toor Daal',
    aliases: ['toor daal', 'toor', 'arhar', 'daal toor'],
    unit: 'kg',
    unitLabel: 'per kg',
    price: 160,
    emoji: '🫘',
    category: 'apna',
    defaultQty: 1,
  },
  {
    id: 'chawal',
    name: 'Basmati Chawal',
    aliases: ['chawal', 'rice', 'basmati'],
    unit: 'kg',
    unitLabel: 'per kg',
    price: 92,
    emoji: '🍚',
    category: 'apna',
    defaultQty: 1,
  },
  {
    id: 'aata',
    name: 'Chakki Fresh Aata',
    aliases: ['aata', 'ata', 'maida', 'wheat flour'],
    unit: 'kg',
    unitLabel: 'per kg',
    price: 48,
    emoji: '🌾',
    category: 'apna',
    defaultQty: 1,
  },
  {
    id: 'namak',
    name: 'Tata Namak',
    aliases: ['namak', 'salt', 'namkin'],
    unit: 'packet',
    unitLabel: '1 kg',
    price: 28,
    emoji: '🧂',
    category: 'apna',
    defaultQty: 1,
  },
  {
    id: 'chai-patti',
    name: 'Red Label Chai Patti',
    aliases: ['chai patti', 'chai', 'tea', 'tea patti'],
    unit: 'packet',
    unitLabel: '250 g',
    price: 145,
    emoji: '🍵',
    category: 'snacks',
    defaultQty: 1,
  },
  {
    id: 'maggi-90g',
    name: 'Maggi 2-Min Noodles',
    aliases: ['maggi', 'noodles', 'maggi packet'],
    unit: 'packet',
    unitLabel: '90 g',
    price: 14,
    emoji: '🍜',
    category: 'snacks',
    defaultQty: 2,
  },
  {
    id: 'parle-g',
    name: 'Parle-G Biscuits',
    aliases: ['parle g', 'parle', 'biscuit', 'biscuits'],
    unit: 'packet',
    unitLabel: '400 g',
    price: 20,
    emoji: '🍪',
    category: 'snacks',
    defaultQty: 1,
  },
  {
    id: 'nariyal-tel',
    name: 'Nariyal Tel',
    aliases: ['nariyal tel', 'coconut oil'],
    unit: 'bottle',
    unitLabel: '500 ml',
    price: 190,
    emoji: '🥥',
    category: 'essential',
    defaultQty: 1,
  },
];

/** Hindi/English words for the small integers shoppers actually use. */
const NUMBER_WORDS: Record<string, number> = {
  ek: 1,
  do: 2,
  teen: 3,
  chaar: 4,
  char: 4,
  paanch: 5,
  chhe: 6,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

export interface DemoCartLine {
  product: DemoProduct;
  qty: number;
  /** The raw phrase that matched (shown in the transcript highlight). */
  matched: string;
  /** Start offset of the matched alias in the normalized transcript. */
  span: number;
}

export interface VoiceParseResult {
  lines: DemoCartLine[];
  /** True when at least one item was recognised. */
  found: boolean;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[,.!?;:]+/g, ' ') // commas/periods must not break alias spans
    .replace(/\s+/g, ' ')
    .trim();
}

const UNIT_SUFFIX = `(\\s*(?:packet|pack|kg|kilo|kilogram|litre|l|pc|pcs|piece|g|gram|gm|bottle|dozen))?`;

/**
 * Extract the quantity that precedes a matched alias, e.g.
 * "2 packet amul milk" → 2, "1kg pyaaz" → 1, "do packet bread" → 2.
 */
function extractQtyBefore(text: string, aliasStart: number, product: DemoProduct): number {
  const windowText = text.slice(Math.max(0, aliasStart - 24), aliasStart);
  const numMatch = windowText.match(
    new RegExp(`(${Object.keys(NUMBER_WORDS).join('|')}|\\d+)${UNIT_SUFFIX}\\s*$`),
  );
  if (!numMatch) return product.defaultQty;
  const token = numMatch[1];
  const numeric = NUMBER_WORDS[token];
  const value = Number.isFinite(numeric) ? numeric : parseInt(token, 10);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 24) : product.defaultQty;
}

/**
 * Match a Hinglish voice transcript against the demo catalog.
 * Order of the transcript is preserved in the result.
 */
export function parseVoiceParchi(rawText: string): VoiceParseResult {
  const text = ` ${normalize(rawText)} `;
  const lines: DemoCartLine[] = [];
  const usedSpans: Array<[number, number]> = [];

  // Longest aliases first so "amul milk" wins over "amul".
  const ranked = [...DEMO_CATALOG].sort((a, b) => {
    const la = Math.max(...a.aliases.map((x) => x.length));
    const lb = Math.max(...b.aliases.map((x) => x.length));
    return lb - la;
  });

  for (const product of ranked) {
    for (const alias of product.aliases) {
      const needle = ` ${alias} `;
      let from = 0;
      let matched = false;
      for (;;) {
        const at = text.indexOf(needle, from);
        if (at === -1) break;
        const start = at + 1;
        const end = at + alias.length;
        if (!usedSpans.some(([s, e]) => start < e && end > s)) {
          const qty = extractQtyBefore(text, start, product);
          lines.push({ product, qty, matched: alias, span: start });
          usedSpans.push([start, end]);
          matched = true;
          break;
        }
        from = at + 1;
      }
      if (matched) break;
    }
  }

  // Preserve transcript order in the cart.
  lines.sort((a, b) => a.span - b.span);

  return { lines, found: lines.length > 0 };
}

export const VOICE_CHIPS: Array<{ label: string; phrase: string }> = [
  { label: '2 packet Amul milk aur bread', phrase: '2 packet Amul milk aur 1 packet bread' },
  { label: '1kg Pyaaz aur Fortune tel', phrase: '1kg pyaaz aur fortune tel' },
  { label: 'Toor daal ek kilo', phrase: 'toor daal ek kilo' },
  { label: 'Maggi 2 packet', phrase: 'maggi do packet' },
];

export const CART_TOTAL_LABEL = 'Kul (incl. free delivery)';
