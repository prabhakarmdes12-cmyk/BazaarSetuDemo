export type ShopBotIntent =
  | 'ADD_ITEM'
  | 'REMOVE_ITEM'
  | 'CHANGE_QUANTITY'
  | 'CHANGE_BRAND'
  | 'ACCEPT_SUBSTITUTION'
  | 'REJECT_SUBSTITUTION'
  | 'CONFIRM_BASKET'
  | 'ASK_PRICE'
  | 'ASK_AVAILABILITY'
  | 'ASK_DELIVERY'
  | 'CANCEL_REQUEST';

export type AvailabilityStatus = 'AVAILABLE' | 'SUBSTITUTE_PROPOSED' | 'UNAVAILABLE' | 'NEEDS_MERCHANT_CHECK';

export interface CatalogueProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  category?: string | null;
  isAvailable: boolean;
}

export interface ExistingDraftItem {
  id: string;
  rawText: string;
  requestedName: string;
  quantity: number;
  unit: string;
  matchedProductId?: string | null;
}

export interface ParsedBasketItem {
  rawText: string;
  requestedName: string;
  quantity: number;
  unit: string;
  brandPreference?: string;
  matchedProductId?: string;
  matchConfidence: number;
  catalogPrice?: number;
  availabilityStatus: AvailabilityStatus;
  requiresClarification: boolean;
  /**
   * Price the shopper called out for a pack size — "das wali Maggi",
   * "10 rupaye wala biscuit". Used to disambiguate SKUs of the same brand.
   */
  priceHint?: number;
}

export interface ParsedCommand {
  intent: ShopBotIntent;
  items: ParsedBasketItem[];
  removeTerms: string[];
  updateTarget?: ParsedBasketItem;
  changeBrand?: { from: string; to: ParsedBasketItem };
  basketAction: string;
}

const NUMBER_WORDS: Record<string, number> = {
  ek: 1,
  eik: 1,
  one: 1,
  '1': 1,
  एक: 1,
  do: 2,
  two: 2,
  '2': 2,
  दो: 2,
  teen: 3,
  tin: 3,
  three: 3,
  '3': 3,
  तीन: 3,
  char: 4,
  chaar: 4,
  four: 4,
  '4': 4,
  चार: 4,
  paanch: 5,
  panch: 5,
  five: 5,
  '5': 5,
  पांच: 5,
  che: 6,
  chhe: 6,
  six: 6,
  '6': 6,
  सात: 7,
  saat: 7,
  seven: 7,
  आठ: 8,
  aath: 8,
  eight: 8,
  नौ: 9,
  nau: 9,
  nine: 9,
  दस: 10,
  das: 10,
  ten: 10,
  gyarah: 11,
  eleven: 11,
  barah: 12,
  twelve: 12,
  darjan: 12,
  dozen: 12,
  bees: 20,
  bis: 20,
  twenty: 20,
  pachas: 50,
  pachaas: 50,
  fifty: 50,
  sau: 100,
  hundred: 100,
  half: 0.5,
  aadha: 0.5,
  adha: 0.5,
  aadhi: 0.5,
  आधा: 0.5,
  // Bharat kitchen fractions: "pau kilo chini", "dedh litre doodh".
  pau: 0.25,
  paav: 0.25,
  quarter: 0.25,
  sava: 1.25,
  dedh: 1.5,
  ded: 1.5,
  dhai: 2.5,
  dhaai: 2.5,
};

const UNIT_ALIASES: Array<{ unit: string; aliases: string[] }> = [
  { unit: 'kg', aliases: ['kg', 'kgs', 'kilo', 'kilos', 'kilogram', 'kilograms', 'किलो'] },
  { unit: 'g', aliases: ['g', 'gm', 'gms', 'gram', 'grams', 'ग्राम'] },
  { unit: 'l', aliases: ['l', 'ltr', 'litre', 'litres', 'liter', 'liters', 'लीटर'] },
  { unit: 'ml', aliases: ['ml', 'millilitre', 'milliliter'] },
  { unit: 'packet', aliases: ['packet', 'packets', 'pkt', 'pkts', 'pack', 'packs', 'pouch', 'pouches', 'packetwa'] },
  { unit: 'piece', aliases: ['piece', 'pieces', 'pcs', 'pc', 'unit', 'units', 'bottle', 'bottles', 'dabba', 'डिब्बा'] },
];

const UNIT_LOOKUP = UNIT_ALIASES.reduce<Record<string, string>>((acc, entry) => {
  entry.aliases.forEach((alias) => {
    acc[alias] = entry.unit;
  });
  return acc;
}, {});

const UNIT_PATTERN = UNIT_ALIASES.flatMap((entry) => entry.aliases)
  .sort((a, b) => b.length - a.length)
  .map((alias) => alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const FILLER_WORDS = new Set([
  'mujhe', 'mujko', 'hume', 'humen', 'humko', 'please', 'pls', 'chahiye', 'chaiye', 'chahie', 'chaahiye',
  'bhej', 'bhejo', 'bhejdo', 'bhej', 'de', 'dena', 'do', 'kar', 'karo', 'kr', 'bas', 'sirf', 'only',
  'same', 'list', 'shopping', 'cart', 'jo', 'wo', 'woh', 'whatever', 'koi', 'aur', 'and', 'wala', 'wali', 'wale', 'ek', 'the', 'a', 'an', 'ki', 'ka', 'ke', 'kaafi', 'thoda',
  'achha', 'acha', 'accha', 'good', 'best', 'cheap', 'sasta', 'sasti', 'quality', 'hai', 'hain', 'ho',
]);

const CANONICAL_TOKEN: Record<string, string> = {
  aata: 'atta',
  atta: 'atta',
  aatta: 'atta',
  flour: 'atta',
  gehu: 'atta',
  wheat: 'atta',
  daal: 'dal',
  dal: 'dal',
  pulse: 'dal',
  pulses: 'dal',
  surf: 'surf',
  ariel: 'ariel',
  oil: 'oil',
  tel: 'oil',
  hair: 'hair',
  shampoo: 'shampoo',
  chawal: 'rice',
  rice: 'rice',
  sugar: 'sugar',
  cheeni: 'sugar',
  chini: 'sugar',
  salt: 'salt',
  namak: 'salt',
  haldi: 'turmeric',
  turmeric: 'turmeric',
  // --- Paaska Sahayak phonetic map for the master kirana catalog ---
  // Dairy & breakfast
  doodh: 'milk',
  dudh: 'milk',
  dhood: 'milk',
  milk: 'milk',
  दूध: 'milk',
  dahi: 'curd',
  curd: 'curd',
  yoghurt: 'curd',
  yogurt: 'curd',
  paneer: 'paneer',
  makhan: 'butter',
  butter: 'butter',
  ghee: 'ghee',
  ghi: 'ghee',
  bread: 'bread',
  double: 'bread',
  roti: 'bread',
  anda: 'egg',
  ande: 'egg',
  egg: 'egg',
  eggs: 'egg',
  // Staples
  maida: 'maida',
  besan: 'besan',
  suji: 'sooji',
  sooji: 'sooji',
  rawa: 'sooji',
  arhar: 'toor',
  toor: 'toor',
  tur: 'toor',
  moong: 'moong',
  mung: 'moong',
  masoor: 'masoor',
  chana: 'chana',
  channa: 'chana',
  rajma: 'rajma',
  poha: 'poha',
  khula: 'khula',
  usna: 'usna',
  arwa: 'arwa',
  sattu: 'sattu',
  sabudana: 'sabudana',
  daliya: 'daliya',
  gud: 'gud',
  jaggery: 'gud',
  // Spices & condiments
  mirch: 'chilli',
  mirchi: 'chilli',
  chilli: 'chilli',
  chili: 'chilli',
  dhaniya: 'coriander',
  dhania: 'coriander',
  coriander: 'coriander',
  jeera: 'cumin',
  zeera: 'cumin',
  cumin: 'cumin',
  garam: 'garam',
  masala: 'masala',
  imli: 'tamarind',
  golki: 'golki',
  pepper: 'golki',
  elaichi: 'elaichi',
  cardamom: 'elaichi',
  laung: 'laung',
  clove: 'laung',
  cloves: 'laung',
  dalchini: 'dalchini',
  cinnamon: 'dalchini',
  tejpatta: 'tejpatta',
  bayleaf: 'tejpatta',
  saunf: 'saunf',
  fennel: 'saunf',
  sarson: 'sarson',
  mustard: 'sarson',
  rai: 'rai',
  kalonji: 'kalonji',
  mangrela: 'kalonji',
  ajwain: 'ajwain',
  methi: 'methi',
  kasuri: 'kasuri',
  hing: 'hing',
  // Dry fruits and mewa
  kaju: 'kaju',
  cashew: 'kaju',
  cashews: 'kaju',
  kismis: 'kismis',
  kishmish: 'kismis',
  raisin: 'kismis',
  raisins: 'kismis',
  badam: 'badam',
  badaam: 'badam',
  almond: 'almond',
  almonds: 'almond',
  makhana: 'makhana',
  akhrot: 'akhrot',
  walnut: 'akhrot',
  anjeer: 'anjeer',
  fig: 'anjeer',
  figs: 'anjeer',
  magaz: 'magaz',
  posta: 'posta',
  // Loose snacks and pooja
  muri: 'muri',
  murmura: 'muri',
  chooda: 'chooda',
  chivda: 'chivda',
  rusk: 'rusk',
  toast: 'rusk',
  kapoor: 'kapoor',
  kapur: 'kapoor',
  camphor: 'kapoor',
  batti: 'batti',
  hawan: 'hawan',
  havan: 'hawan',
  roli: 'roli',
  kumkum: 'kumkum',
  chandan: 'chandan',
  mauli: 'mauli',
  supari: 'supari',
  sindoor: 'sindoor',
  // Beverages & snacks
  chai: 'tea',
  chaay: 'tea',
  chaha: 'tea',
  tea: 'tea',
  patti: 'tea',
  coffee: 'coffee',
  kaufi: 'coffee',
  biscuit: 'biscuit',
  biskut: 'biscuit',
  biskoot: 'biscuit',
  biscuits: 'biscuit',
  namkeen: 'namkeen',
  noodles: 'noodles',
  maggi: 'maggi',
  maggie: 'maggi',
  magi: 'maggi',
  // Home & personal care
  sabun: 'soap',
  saabun: 'soap',
  soap: 'soap',
  detergent: 'detergent',
  powder: 'powder',
  toothpaste: 'toothpaste',
  manjan: 'toothpaste',
  paste: 'toothpaste',
  phenyl: 'phenyl',
  jhadu: 'broom',
  broom: 'broom',
  // Produce
  aloo: 'potato',
  alu: 'potato',
  potato: 'potato',
  pyaz: 'onion',
  pyaaz: 'onion',
  onion: 'onion',
  tamatar: 'tomato',
  tomato: 'tomato',
  adrak: 'ginger',
  ginger: 'ginger',
  lehsun: 'garlic',
  lahsun: 'garlic',
  garlic: 'garlic',
  nimbu: 'lemon',
  lemon: 'lemon',
  kela: 'banana',
  banana: 'banana',
  seb: 'apple',
  apple: 'apple',
};

// Popular brand spellings shoppers slur over the phone. Kept separate from the
// generic canonical map so brand tokens survive intact for SKU disambiguation.
const BRAND_TOKEN: Record<string, string> = {
  amool: 'amul',
  amul: 'amul',
  ammul: 'amul',
  aashirvad: 'aashirvaad',
  aashirwad: 'aashirvaad',
  ashirvad: 'aashirvaad',
  ashirwad: 'aashirvaad',
  aashirvaad: 'aashirvaad',
  britania: 'britannia',
  britannia: 'britannia',
  parle: 'parle',
  parleg: 'parle',
  fortun: 'fortune',
  fortune: 'fortune',
  tataa: 'tata',
  tata: 'tata',
  sampan: 'sampann',
  sampann: 'sampann',
  colgat: 'colgate',
  colgate: 'colgate',
  lifboy: 'lifebuoy',
  lifebuoy: 'lifebuoy',
  redlabel: 'red',
  taza: 'taaza',
  taaza: 'taaza',
};

function normalizeSpace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeForMatch(value: string): string {
  return normalizeSpace(
    value
      .toLowerCase()
      .replace(/[₹,;:!?()\[\]{}"']/g, ' ')
      .replace(/\s+/g, ' '),
  );
}

function canonicalToken(token: string): string {
  const normalized = token.toLowerCase().trim();
  return BRAND_TOKEN[normalized] || CANONICAL_TOKEN[normalized] || normalized;
}

function tokenize(value: string): string[] {
  return normalizeForMatch(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !FILLER_WORDS.has(token))
    .filter((token) => !UNIT_LOOKUP[token])
    .filter((token) => !/^\d+(?:\.\d+)?$/.test(token))
    .map(canonicalToken);
}

function parseQuantity(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const normalized = raw.toLowerCase().trim();
  if (/^\d+(?:\.\d+)?$/.test(normalized)) return Number(normalized);
  return NUMBER_WORDS[normalized];
}

function normalizeUnit(unit: string | undefined): string | undefined {
  if (!unit) return undefined;
  return UNIT_LOOKUP[unit.toLowerCase()] || unit.toLowerCase();
}

function titleCaseName(rawName: string): string {
  const compact = normalizeSpace(rawName.replace(/\s+/g, ' '));
  if (!compact) return 'Custom Item';
  return compact
    .split(' ')
    .map((part) => (part.length <= 2 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
    .join(' ');
}

function cleanItemName(raw: string): string {
  let value = normalizeForMatch(raw)
    .replace(new RegExp(`\\b(?:${UNIT_PATTERN})\\b`, 'gi'), ' ')
    .replace(/\b\d+(?:\.\d+)?\b/g, ' ');

  const parts = value
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !FILLER_WORDS.has(part))
    .filter((part) => NUMBER_WORDS[part] === undefined);

  return titleCaseName(parts.join(' '));
}

function hasEconomicalQualityPreference(message: string): boolean {
  const lower = normalizeForMatch(message);
  return /(sasta|cheap|budget|economical)/i.test(lower) && /(accha|acha|achha|good|quality|best)/i.test(lower);
}

function hasQualityPreference(message: string): boolean {
  const lower = normalizeForMatch(message);
  return /(accha|acha|achha|good|quality|best)/i.test(lower);
}

function splitPotentialItems(message: string): string[] {
  const replaced = message
    .replace(/\s+(?:aur|और|and|&)\s+/gi, ',')
    .replace(/\s*[,;\n]+\s*/g, ',');
  return replaced
    .split(',')
    .map((part) => normalizeSpace(part))
    .filter(Boolean);
}

const NUMBER_ALTERNATION = Object.keys(NUMBER_WORDS)
  .sort((a, b) => b.length - a.length)
  .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

const QTY_PATTERN = `(?:\\d+(?:\\.\\d+)?|${NUMBER_ALTERNATION})`;

const PRICE_HINT_PATTERNS = [
  // "10 rupaye wali maggi", "das rupaye wala biscuit"
  new RegExp(`\\b(${QTY_PATTERN})\\s*(?:rupaye|rupaya|rupay|rupee|rupees|rs\\.?|inr)\\s*(?:wala|wali|wale|ka|ki|ke)?\\b`, 'i'),
  // "₹10 wali maggi"
  new RegExp(`₹\\s*(\\d+(?:\\.\\d+)?)`, 'i'),
  // "das wali maggi" — no currency word at all, the classic kirana phrasing
  new RegExp(`\\b(${QTY_PATTERN})\\s*(?:wala|wali|wale)\\b`, 'i'),
];

/**
 * Pull a rupee pack-size hint out of a phrase ("das wali Maggi" => ₹10) and
 * return the phrase with that fragment removed so quantity parsing does not
 * mistake the price for a count.
 */
export function extractPriceHint(phrase: string): { priceHint?: number; rest: string } {
  for (const pattern of PRICE_HINT_PATTERNS) {
    const match = phrase.match(pattern);
    if (!match) continue;
    const value = parseQuantity(match[1]);
    if (value === undefined || value <= 0) continue;
    return {
      priceHint: value,
      rest: normalizeSpace(phrase.replace(match[0], ' ')),
    };
  }
  return { rest: normalizeSpace(phrase) };
}

export function parseItemPhrase(rawPhrase: string, defaults?: Partial<Pick<ParsedBasketItem, 'quantity' | 'unit' | 'brandPreference'>>): ParsedBasketItem {
  const rawText = normalizeSpace(rawPhrase);
  const { priceHint, rest } = extractPriceHint(normalizeForMatch(rawText));
  const lower = rest;
  const qtyPattern = QTY_PATTERN;

  let quantity = defaults?.quantity ?? 1;
  let unit = defaults?.unit ?? 'piece';
  let namePart = lower;

  const prefixQtyUnit = lower.match(new RegExp(`^(${qtyPattern})\\s*(${UNIT_PATTERN})\\b\\s*(.+)$`, 'i'));
  const prefixQtyNameUnit = lower.match(new RegExp(`^(${qtyPattern})\\s+(.+?)\\s+(${UNIT_PATTERN})\\b(?:\\s|$)(.*)$`, 'i'));
  const suffixQtyUnit = lower.match(new RegExp(`^(.+?)\\s+(${qtyPattern})\\s*(${UNIT_PATTERN})\\b(?:\\s|$)(.*)$`, 'i'));
  const prefixQtyOnly = lower.match(new RegExp(`^(${qtyPattern})\\s+(.+)$`, 'i'));

  if (prefixQtyUnit) {
    quantity = parseQuantity(prefixQtyUnit[1]) ?? quantity;
    unit = normalizeUnit(prefixQtyUnit[2]) ?? unit;
    namePart = prefixQtyUnit[3];
  } else if (prefixQtyNameUnit) {
    quantity = parseQuantity(prefixQtyNameUnit[1]) ?? quantity;
    unit = normalizeUnit(prefixQtyNameUnit[3]) ?? unit;
    namePart = `${prefixQtyNameUnit[2]} ${prefixQtyNameUnit[4] || ''}`;
  } else if (suffixQtyUnit) {
    quantity = parseQuantity(suffixQtyUnit[2]) ?? quantity;
    unit = normalizeUnit(suffixQtyUnit[3]) ?? unit;
    namePart = `${suffixQtyUnit[1]} ${suffixQtyUnit[4] || ''}`;
  } else if (prefixQtyOnly) {
    quantity = parseQuantity(prefixQtyOnly[1]) ?? quantity;
    namePart = prefixQtyOnly[2];
  }

  const brandPreference = hasEconomicalQualityPreference(rawText)
    ? 'economical_quality'
    : hasQualityPreference(rawText)
      ? 'quality'
      : defaults?.brandPreference;

  return {
    rawText,
    requestedName: cleanItemName(namePart),
    quantity,
    unit,
    ...(brandPreference && { brandPreference }),
    ...(priceHint !== undefined && { priceHint }),
    matchConfidence: 0,
    availabilityStatus: 'NEEDS_MERCHANT_CHECK',
    requiresClarification: true,
  };
}

function scoreProductMatch(itemName: string, product: CatalogueProduct): number {
  const itemTokens = tokenize(itemName);
  const productTokens = tokenize(`${product.name} ${product.category || ''}`);
  if (itemTokens.length === 0 || productTokens.length === 0) return 0;

  const normalizedItem = itemTokens.join(' ');
  const normalizedProduct = productTokens.join(' ');
  if (normalizedProduct === normalizedItem) return 0.98;
  if (normalizedProduct.includes(normalizedItem) || normalizedItem.includes(normalizedProduct)) return 0.92;

  const productSet = new Set(productTokens);
  const sharedTokens = itemTokens.filter((token) => productSet.has(token));
  const shared = sharedTokens.length;
  if (shared === 0) return 0;

  // Avoid false positives like "hair oil" matching edible "mustard oil" just
  // because a generic category token overlaps. The merchant should manually
  // verify those requests instead of Chiti Bazaar inventing a SKU match.
  const genericTokens = new Set(['oil', 'packet', 'piece', 'detergent', 'soap', 'item', 'product']);
  if (itemTokens.length > 1 && shared === 1 && genericTokens.has(sharedTokens[0])) return 0;

  const coverage = shared / itemTokens.length;
  const specificityBonus = product.isAvailable ? 0.05 : 0;
  return Math.min(0.9, 0.55 + coverage * 0.3 + specificityBonus);
}

/**
 * When the shopper called out a rupee pack size ("das wali Maggi"), nudge SKUs
 * priced near that value ahead of other same-brand variants. The nudge is small
 * enough that it never manufactures a match out of an unrelated product.
 */
function priceHintBonus(item: ParsedBasketItem, product: CatalogueProduct): number {
  if (item.priceHint === undefined || !Number.isFinite(product.price)) return 0;
  const delta = Math.abs(product.price - item.priceHint);
  if (delta <= 0.5) return 0.06;
  if (delta <= item.priceHint * 0.15) return 0.03;
  return 0;
}

export function enrichWithCatalogue(item: ParsedBasketItem, products: CatalogueProduct[]): ParsedBasketItem {
  let best: { product: CatalogueProduct; score: number } | undefined;
  for (const product of products) {
    const baseScore = scoreProductMatch(item.requestedName, product);
    // Only a real textual match earns the price nudge — never a bare price.
    const score = baseScore > 0 ? Math.min(0.99, baseScore + priceHintBonus(item, product)) : 0;
    if (!best || score > best.score) best = { product, score };
  }

  if (!best || best.score < 0.58) {
    return {
      ...item,
      matchConfidence: 0,
      availabilityStatus: 'NEEDS_MERCHANT_CHECK',
      requiresClarification: true,
    };
  }

  const availabilityStatus: AvailabilityStatus = best.product.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE';
  return {
    ...item,
    matchedProductId: best.product.id,
    matchConfidence: Number(best.score.toFixed(2)),
    catalogPrice: best.product.price,
    availabilityStatus,
    requiresClarification: !best.product.isAvailable,
  };
}

function isLikelyQuantityChange(message: string, existingItems: ExistingDraftItem[]): boolean {
  if (existingItems.length === 0) return false;
  const candidate = parseItemPhrase(message);
  if (!candidate.requestedName || candidate.requestedName === 'Custom Item') return false;
  if (candidate.quantity === 1 && !new RegExp(`\\b(?:${UNIT_PATTERN})\\b`, 'i').test(message)) return false;
  return existingItems.some((item) => itemMatchesTerm(item, candidate.requestedName));
}

export function inferIntent(message: string, existingItems: ExistingDraftItem[] = [], hasProposedAdjustment = false): ShopBotIntent {
  const lower = normalizeForMatch(message);

  if (/\b(cancel|cancelled|radd|रद्द)\b/.test(lower)) return 'CANCEL_REQUEST';
  if (hasProposedAdjustment && /\b(haan|han|yes|approve|accept|accepted|theek|thik|ok|okay|done)\b/.test(lower)) return 'ACCEPT_SUBSTITUTION';
  if (hasProposedAdjustment && /\b(nahi|nahin|no|reject|decline|mat)\b/.test(lower)) return 'REJECT_SUBSTITUTION';
  if (/\b(kitna|price|daam|dam|rate|cost)\b/.test(lower)) return 'ASK_PRICE';
  if (/\b(delivery|deliver|ghar|home delivery|pickup|pick up)\b/.test(lower)) return 'ASK_DELIVERY';
  if (/\b(available|milega|mil jayega|hai kya|stock)\b/.test(lower)) return 'ASK_AVAILABILITY';
  if (/\b(nahi|nahin|nhi|नहीं|नही)\b/.test(lower) && /\b(kar|karo|replace|badal|instead|de|do)\b/.test(lower)) return 'CHANGE_BRAND';
  if (/\b(hata|hatao|remove|delete|nikal|nikaal|निकाल)\b/.test(lower)) return 'REMOVE_ITEM';
  if (/\b(confirm|pakka|final|checkout|order kar|order karo|theek hai|thik hai)\b/.test(lower)) return 'CONFIRM_BASKET';
  if (isLikelyQuantityChange(message, existingItems)) return 'CHANGE_QUANTITY';
  return 'ADD_ITEM';
}

export function itemMatchesTerm(item: ExistingDraftItem, term: string): boolean {
  const termTokens = tokenize(term);
  if (termTokens.length === 0) return false;
  const itemTokens = tokenize(`${item.requestedName} ${item.rawText}`);
  const itemSet = new Set(itemTokens);
  return termTokens.every((token) => itemSet.has(token)) || termTokens.some((token) => itemSet.has(token));
}

function parseRemoveTerms(message: string): string[] {
  const lower = normalizeForMatch(message);
  const withoutCommand = lower
    .replace(/\b(hata\s*do|hatao|remove|delete|nikal\s*do|nikaal\s*do|nikalo|निकाल)\b/gi, ' ')
    .replace(/\b(item|samaan|product)\b/gi, ' ');
  const cleaned = cleanItemName(withoutCommand);
  return cleaned && cleaned !== 'Custom Item' ? [cleaned] : [];
}

function parseChangeBrand(message: string, existingItems: ExistingDraftItem[], products: CatalogueProduct[]): ParsedCommand['changeBrand'] {
  const normalized = normalizeSpace(message);
  const match = normalized.match(/(.+?)\s+(?:nahi|nahin|nhi|नहीं|नही)\s+(.+?)(?:\s+(?:kar\s*do|kr\s*do|karna|karo|de\s*do|do|chahiye|chaiye))?$/i);
  if (!match) return undefined;

  const from = cleanItemName(match[1]);
  const existing = existingItems.find((item) => itemMatchesTerm(item, from));
  const replacementDefaults = existing
    ? { quantity: existing.quantity, unit: existing.unit }
    : { quantity: 1, unit: 'packet' };
  const to = enrichWithCatalogue(parseItemPhrase(match[2], replacementDefaults), products);
  return { from, to };
}

function parseQuantityChange(message: string, existingItems: ExistingDraftItem[], products: CatalogueProduct[]): ParsedBasketItem | undefined {
  const parsed = enrichWithCatalogue(parseItemPhrase(message), products);
  if (!parsed.requestedName || parsed.requestedName === 'Custom Item') return undefined;
  const existing = existingItems.find((item) => itemMatchesTerm(item, parsed.requestedName));
  if (!existing && existingItems.length > 0) return undefined;
  return parsed;
}

function parseAddItems(message: string, products: CatalogueProduct[]): ParsedBasketItem[] {
  return splitPotentialItems(message)
    .map((part) => enrichWithCatalogue(parseItemPhrase(part), products))
    .filter((item) => item.requestedName && item.requestedName !== 'Custom Item');
}

export function parseShoppingIntent(
  message: string,
  products: CatalogueProduct[],
  existingItems: ExistingDraftItem[] = [],
  hasProposedAdjustment = false,
): ParsedCommand {
  const intent = inferIntent(message, existingItems, hasProposedAdjustment);

  if (intent === 'REMOVE_ITEM') {
    return { intent, items: [], removeTerms: parseRemoveTerms(message), basketAction: 'REMOVE_MATCHING_ITEMS' };
  }

  if (intent === 'CHANGE_BRAND') {
    const changeBrand = parseChangeBrand(message, existingItems, products);
    return {
      intent,
      items: changeBrand ? [changeBrand.to] : [],
      removeTerms: changeBrand ? [changeBrand.from] : [],
      changeBrand,
      basketAction: 'CHANGE_BRAND_IN_DRAFT',
    };
  }

  if (intent === 'CHANGE_QUANTITY') {
    const updateTarget = parseQuantityChange(message, existingItems, products);
    return {
      intent,
      items: updateTarget ? [updateTarget] : [],
      removeTerms: [],
      updateTarget,
      basketAction: 'UPDATE_ITEM_QUANTITY',
    };
  }

  if (intent === 'CANCEL_REQUEST') {
    return { intent, items: [], removeTerms: [], basketAction: 'CANCEL_DRAFT' };
  }

  if (intent === 'CONFIRM_BASKET') {
    return { intent, items: [], removeTerms: [], basketAction: 'CONFIRM_CURRENT_DRAFT' };
  }

  if (intent === 'ACCEPT_SUBSTITUTION' || intent === 'REJECT_SUBSTITUTION') {
    return { intent, items: [], removeTerms: [], basketAction: intent };
  }

  if (intent === 'ASK_PRICE' || intent === 'ASK_AVAILABILITY' || intent === 'ASK_DELIVERY') {
    return { intent, items: parseAddItems(message, products), removeTerms: [], basketAction: 'ANSWER_QUERY_WITH_DRAFT_CONTEXT' };
  }

  return { intent, items: parseAddItems(message, products), removeTerms: [], basketAction: 'ADD_ITEMS_TO_DRAFT' };
}

export const parseShopBotCommand = parseShoppingIntent;

export function buildUnresolvedQuestions(items: ParsedBasketItem[]): string[] {
  return items
    .filter((item) => item.requiresClarification || item.availabilityStatus === 'NEEDS_MERCHANT_CHECK')
    .map((item) => `${item.requestedName}: merchant se availability aur final price confirm karna hai.`);
}
