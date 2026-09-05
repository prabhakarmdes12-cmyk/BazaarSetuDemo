#!/usr/bin/env node
/**
 * Central Product Asset Repository — manifest builder (Dhanbad pilot, batch 1).
 *
 * Scans public/catalog/items/[category]/[sku-slug].jpg, verifies every asset
 * actually exists on disk and is a 600x600 studio pack shot, and writes the
 * index manifest public/catalog/catalog-assets.json mapping skuId -> path.
 *
 * The manifest is the single source of truth consumed by
 * scripts/gen-bighi-catalog.cjs (which stamps per-SKU imagery onto the master
 * catalog) so a new pack shot flows to every dukaan in the network.
 *
 * Usage:  node scripts/gen-catalog-assets.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ITEMS_DIR = path.join(ROOT, 'public', 'catalog', 'items');
const MANIFEST = path.join(ROOT, 'public', 'catalog', 'catalog-assets.json');
const CATALOG_TS = path.join(ROOT, 'src', 'lib', 'bighiCatalog.ts');

/**
 * skuId -> asset slug, keyed by the master-catalog id in bighiCatalog.ts.
 * Batch 1 covers the top-velocity Dhanbad pilot lines; extend as pack shots
 * are photographed. Every entry is verified against both the catalog and the
 * filesystem below, so a typo fails the build rather than shipping a 404.
 */
const SKU_ASSETS = {
  // Dairy
  'bb-00022': 'dairy/amul-taaza-toned-milk-500ml.jpg',
  'bb-00009': 'dairy/amul-gold-full-cream-milk-1l.jpg',
  'bb-00003': 'dairy/salted-butter-100g.jpg',
  'bb-00004': 'dairy/salted-butter-500g.jpg',
  'bb-00055': 'dairy/salted-butter-100g.jpg',
  'bb-00056': 'dairy/salted-butter-500g.jpg',
  'bb-00014': 'dairy/masti-dahi-curd-400g.jpg',
  'bb-00059': 'dairy/masti-dahi-curd-400g.jpg',
  'bb-00011': 'dairy/malai-paneer-200g.jpg',
  'bb-00037': 'dairy/malai-paneer-200g.jpg',
  'bb-00066': 'dairy/malai-paneer-200g.jpg',
  // Vegetables
  'bb-00109': 'vegetables/desi-tomato-1kg.jpg',
  'bb-00129': 'vegetables/hybrid-potato-1kg.jpg',
  'bb-00138': 'vegetables/red-onion-1kg.jpg',
  'bb-00116': 'vegetables/fresh-coriander-100g.jpg',
  'bb-00133': 'vegetables/palak-spinach-250g.jpg',
  'bb-00089': 'vegetables/bhindi-okra-500g.jpg',
  'bb-00122': 'vegetables/ginger-250g.jpg',
  'bb-00119': 'vegetables/garlic-250g.jpg',
  // Fruits
  'bb-00172': 'fruits/robusta-banana-1kg.jpg',
  'bb-00176': 'fruits/shimla-apple-1kg.jpg',
  'bb-00161': 'fruits/mosambi-1kg.jpg',
  'bb-00170': 'fruits/pomegranate-1kg.jpg',
  'bb-00173': 'fruits/green-grapes-500g.jpg',
  'bb-00165': 'fruits/papaya-1pc.jpg',
  // Staples
  'bb-00200': 'staples/chakki-atta-5kg.jpg',
  'bb-00201': 'staples/chakki-atta-10kg.jpg',
  'bb-00236': 'staples/chakki-atta-5kg.jpg',
  'bb-00237': 'staples/chakki-atta-10kg.jpg',
  'bb-00238': 'staples/classic-basmati-rice-1kg.jpg',
  'bb-00209': 'staples/classic-basmati-rice-1kg.jpg',
  'bb-00290': 'staples/toor-arhar-dal-1kg.jpg',
  'bb-00232': 'staples/toor-arhar-dal-1kg.jpg',
  // Oils
  'bb-00362': 'oils/refined-soyabean-oil-1l.jpg',
  'bb-00416': 'oils/refined-soyabean-oil-1l.jpg',
  'bb-00337': 'oils/kachi-ghani-mustard-oil-1l.jpg',
  'bb-00360': 'oils/kachi-ghani-mustard-oil-1l.jpg',
  // Munchies
  'bb-00500': 'munchies/masala-potato-chips-52g.jpg',
  'bb-00501': 'munchies/masala-potato-chips-52g.jpg',
  'bb-00496': 'munchies/masala-corn-puffs-70g.jpg',
  'bb-00457': 'munchies/aloo-bhujia-200g.jpg',
  'bb-00431': 'munchies/aloo-bhujia-200g.jpg',
  'bb-00429': 'munchies/butter-popcorn-70g.jpg',
  // Beverages
  'bb-00703': 'drinks/cola-750ml.jpg',
  'bb-00779': 'drinks/masala-cola-750ml.jpg',
  'bb-00770': 'drinks/lime-soda-750ml.jpg',
  'bb-00729': 'drinks/mango-drink-600ml.jpg',
  // Tea & coffee
  'bb-00865': 'tea/premium-black-tea-500g.jpg',
  'bb-00870': 'tea/premium-black-tea-500g.jpg',
  'bb-00833': 'tea/instant-coffee-50g.jpg',
  'bb-00838': 'tea/instant-coffee-50g.jpg',
  // Instant
  'bb-00939': 'instant/masala-noodles-pack-of-4.jpg',
  'bb-00946': 'instant/masala-noodles-pack-of-8.jpg',
  'bb-00930': 'instant/mixed-veg-soup-sachet.jpg',
  'bb-00883': 'instant/mixed-veg-soup-sachet.jpg',
  'bb-00924': 'instant/tomato-ketchup-1kg.jpg',
  'bb-00915': 'instant/tomato-ketchup-1kg.jpg',
  // Household
  'bb-01068': 'household/matic-detergent-front-load-1kg.jpg',
  'bb-00980': 'household/matic-detergent-front-load-1kg.jpg',
  'bb-01075': 'household/matic-detergent-front-load-1kg.jpg',
  'bb-01073': 'household/matic-detergent-top-load-1kg.jpg',
  'bb-01081': 'household/dishwash-gel-500ml.jpg',
  'bb-01055': 'household/dishwash-gel-500ml.jpg',
  'bb-00998': 'household/dishwash-gel-500ml.jpg',
  'bb-01013': 'household/toilet-cleaner-1l.jpg',
  'bb-01029': 'household/toilet-cleaner-1l.jpg',
  'bb-01024': 'household/pine-floor-cleaner-1l.jpg',
  'bb-00993': 'household/pine-floor-cleaner-1l.jpg',

  // ---- Batch 2 -------------------------------------------------------------
  // Pooja & festive needs
  'bb-01783': 'pooja/agarbatti-sandalwood-box.jpg',
  'bb-01742': 'pooja/agarbatti-sandalwood-box.jpg',
  'bb-01793': 'pooja/agarbatti-rose-box.jpg',
  'bb-01788': 'pooja/cow-ghee-diya-pack.jpg',
  'bb-01763': 'pooja/cow-ghee-diya-pack.jpg',
  'bb-01745': 'pooja/camphor-kapoor-box.jpg',
  'bb-01779': 'pooja/camphor-kapoor-box.jpg',
  'bb-01768': 'pooja/roli-kumkum-chandan-pack.jpg',
  'bb-01764': 'pooja/roli-kumkum-chandan-pack.jpg',
  'bb-01766': 'pooja/hawan-samagri-500g.jpg',
  'bb-01791': 'pooja/hawan-samagri-500g.jpg',
  'bb-01771': 'pooja/mauli-kalawa-thread.jpg',
  'bb-01753': 'pooja/brass-diya-single.jpg',
  'bb-01754': 'pooja/brass-diya-single.jpg',
  // Dry fruits & regional staples
  'bb-01559': 'dryfruits/phool-makhana-250g.jpg',
  'bb-01580': 'dryfruits/phool-makhana-250g.jpg',
  'bb-01600': 'dryfruits/phool-makhana-250g.jpg',
  'bb-00434': 'dryfruits/roasted-chana-sattu-500g.jpg',
  'bb-00247': 'dryfruits/poha-chooda-500g.jpg',
  'bb-00222': 'dryfruits/poha-chooda-500g.jpg',
  'bb-01632': 'dryfruits/almonds-badam-200g.jpg',
  'bb-01562': 'dryfruits/almonds-badam-200g.jpg',
  'bb-01602': 'dryfruits/almonds-badam-200g.jpg',
  'bb-01635': 'dryfruits/cashew-kaju-200g.jpg',
  'bb-01569': 'dryfruits/cashew-kaju-200g.jpg',
  'bb-01609': 'dryfruits/cashew-kaju-200g.jpg',
  'bb-01641': 'dryfruits/kishmish-raisins-200g.jpg',
  'bb-01586': 'dryfruits/kishmish-raisins-200g.jpg',
  'bb-01618': 'dryfruits/kishmish-raisins-200g.jpg',
  'bb-00276': 'staples/besan-gram-flour-1kg.jpg',
  'bb-00181': 'staples/besan-gram-flour-1kg.jpg',
  'bb-00213': 'staples/besan-gram-flour-1kg.jpg',
  // Spices & masalas (the catalog files masalas under the `oils` category)
  'bb-00425': 'spices/haldi-turmeric-200g.jpg',
  'bb-00385': 'spices/haldi-turmeric-200g.jpg',
  'bb-00298': 'spices/haldi-turmeric-200g.jpg',
  'bb-00377': 'spices/lal-mirch-chilli-200g.jpg',
  'bb-00344': 'spices/lal-mirch-chilli-200g.jpg',
  'bb-00316': 'spices/lal-mirch-chilli-200g.jpg',
  'bb-00380': 'spices/dhaniya-coriander-200g.jpg',
  'bb-00347': 'spices/dhaniya-coriander-200g.jpg',
  'bb-00319': 'spices/dhaniya-coriander-200g.jpg',
  'bb-00382': 'spices/garam-masala-100g.jpg',
  'bb-00349': 'spices/garam-masala-100g.jpg',
  'bb-00321': 'spices/garam-masala-100g.jpg',
  'bb-00391': 'spices/chicken-meat-masala-100g.jpg',
  'bb-00353': 'spices/chicken-meat-masala-100g.jpg',
};

const EXPECTED_PX = 600;

function catalogIndex() {
  if (!fs.existsSync(CATALOG_TS)) return null;
  const src = fs.readFileSync(CATALOG_TS, 'utf8');
  const m = src.match(/const RAW_CATALOG: BighiProduct\[\] = (\[[\s\S]*?\n\]);/);
  if (!m) return null;
  const byId = new Map();
  for (const p of JSON.parse(m[1])) byId.set(p.id, p);
  return byId;
}

/** Minimal JPEG SOF parser — avoids pulling an image dependency into the build. */
function jpegSize(file) {
  const b = fs.readFileSync(file);
  if (b[0] !== 0xff || b[1] !== 0xd8) return null;
  let i = 2;
  while (i < b.length) {
    if (b[i] !== 0xff) { i++; continue; }
    const marker = b[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

const catalog = catalogIndex();
const errors = [];
const entries = {};

for (const [skuId, rel] of Object.entries(SKU_ASSETS)) {
  const abs = path.join(ITEMS_DIR, rel);
  if (!fs.existsSync(abs)) { errors.push(`${skuId}: missing asset ${rel}`); continue; }
  const size = jpegSize(abs);
  if (!size) { errors.push(`${skuId}: ${rel} is not a readable JPEG`); continue; }
  if (size.width !== EXPECTED_PX || size.height !== EXPECTED_PX) {
    errors.push(`${skuId}: ${rel} is ${size.width}x${size.height}, expected ${EXPECTED_PX}x${EXPECTED_PX}`);
    continue;
  }
  if (catalog && !catalog.has(skuId)) { errors.push(`${skuId}: not present in master catalog`); continue; }
  const product = catalog && catalog.get(skuId);
  entries[skuId] = {
    skuId,
    name: product ? product.name : undefined,
    unit: product ? product.unit : undefined,
    categoryId: product ? product.categoryId : rel.split('/')[0],
    path: `/catalog/items/${rel}`,
    width: size.width,
    height: size.height,
    bytes: fs.statSync(abs).size,
    verified: true,
  };
}

// Report any pack shot on disk that no SKU points at — dead weight in the bundle.
const orphans = [];
if (fs.existsSync(ITEMS_DIR)) {
  for (const cat of fs.readdirSync(ITEMS_DIR)) {
    const dir = path.join(ITEMS_DIR, cat);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      const rel = `${cat}/${f}`;
      if (!Object.values(SKU_ASSETS).includes(rel)) orphans.push(rel);
    }
  }
}

if (errors.length) {
  console.error('Asset verification failed:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

const manifest = {
  $schema: 'chiti/catalog-assets@1',
  generatedAt: new Date().toISOString().slice(0, 10),
  pilot: 'dhanbad-quick-commerce',
  spec: {
    dimensions: `${EXPECTED_PX}x${EXPECTED_PX}`,
    format: 'jpg',
    background: '#F8FAFC studio sweep with contact shadow',
    root: '/catalog/items/[category]/[sku-slug].jpg',
  },
  totalAssets: new Set(Object.values(SKU_ASSETS)).size,
  totalSkus: Object.keys(entries).length,
  items: entries,
};

fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

console.log(`Verified ${manifest.totalAssets} pack shots -> ${manifest.totalSkus} SKUs`);
console.log(`Wrote ${path.relative(process.cwd(), MANIFEST)}`);
if (orphans.length) console.log(`  note: ${orphans.length} unmapped asset(s): ${orphans.join(', ')}`);

module.exports = { SKU_ASSETS, MANIFEST };
