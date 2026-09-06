# Paaska — Central Master Product Asset Pipeline Specification

**Standard:** Chiti Technologies Studio Asset Governance  
**Repository Status:** 326 Pack Shots · 752 Mapped SKUs · 26/26 Categories Active (Zero-Coverage: 0)  
**Master Catalog:** 2,242 SKUs across 26 Categories  
**Last Updated:** September 6, 2026

---

## 1. Studio Photography Standards

Every grocery product image in Paaska must adhere to the **Chiti Studio Pack Shot Specification**:

| Attribute | Specification | Rationale |
|---|---|---|
| **Dimensions** | Exactly 600 x 600 pixels (1:1 aspect ratio) | Ensures sharp rendering on high-DPI screens without layout shift. |
| **Format** | Progressive JPEG (`image/jpeg`) | Fast, progressive rendering over constrained 3G/4G networks. |
| **Background** | Clean `#F8FAFC` studio sweep with soft contact shadow | Matches quick-commerce card backgrounds; eliminates harsh cutout edges. |
| **Perspective** | Front-facing 15° slight top-down elevation | Replicates the in-store shelf eye-line of a shopper. |
| **Label Legibility** | Brand name, net weight, and variant visibly sharp | Prevents customer sizing errors and return friction. |

---

## 2. Zero-Misattribution Identity Architecture

In quick commerce, visual misattribution (e.g. showing a 500g pouch image for a 1kg jar) destroys customer trust. Paaska eliminates this by resolving assets against an authoritative tuple:

```ts
type SkuAssetIdentity = [
  categoryId: string,  // e.g. "biscuits"
  productName: string, // e.g. "Britannia NutriChoice Digestive"
  unit: string,        // e.g. "250 g"
  assetSlug: string    // e.g. "biscuits/digestive-biscuits-250g.jpg"
];
```

### Resolution Rules (`PAASKA_INV_010`)
1. **Identity Tuple Matching**: Assets are resolved by `categoryId::name::unit` against the master catalog.
2. **Catalog Unit Precedence**: If an asset filename has a cosmetic discrepancy (e.g. `cream-wafers-75g.jpg`), the catalog database unit (`150 g`) remains authoritative.
3. **Zero Orphans (`PAASKA_INV_011`)**: Any file on disk in `/public/catalog/items/` that is not mapped to at least one active SKU in `catalog-assets.json` is flagged as an error.

---

## 3. Automated Manifest Generation & Verification

Run the automated asset compiler and verification suite:
```bash
npm --prefix frontend run catalog:assets
```

### Verification Criteria (`gen-catalog-assets.cjs`)
- [x] All referenced files exist in `/public/catalog/items/`.
- [x] Every file is a valid JPEG with dimensions exactly 600 x 600 pixels.
- [x] Every mapped SKU exists in the master catalog (`bighiCatalog.ts`).
- [x] Zero duplicate SKU mappings.
- [x] Zero orphan files on disk.

---

## 4. Current Milestone: Batch 1 through Batch 5 Complete


### Batch 6 Summary (Committed `b60f350`, Merged into Production)
- **New Shots Added:** 70 studio pack shots across 7 commits (`fd719da` → `b60f350`).
- **Coverage Growth:** 552 → 752 mapped SKUs across 26 categories.
- **Mission Accomplished:** All 4 remaining zero-coverage aisles saturated:
  - `pet`: **48/48 (100%)**
  - `electronics`: **45/46 (97.8%)**
  - `beauty`: **54/60 (90.0%)**
  - `stationery`: **53/60 (88.3%)**
- **Zero-Coverage Categories:** **0** across the entire platform.

### Batch 5 Summary (Committed `0ee54ec`, Merged `5ff2a80`)
- **New Shots Added:** 70 studio pack shots across 8 commits (`be1f9d4` → `0ee54ec`).
- **Coverage Growth:** 216 → 552 mapped SKUs.
- **Aisle Impact:** Every food aisle is out of the teens (Meat at 100%, Chocolates 40%, Munchies 35%, Breakfast 34%, Tea 30%, Biscuits 29%).

### Category Coverage Breakdown (Live Status)

| Category | Covered / Total | Percentage | Priority Assessment |
|---|---|---|---|
| `meat` | 50 / 50 | **100.0%** | ⭐ Strong Coverage (Complete Aisle) |
| `pooja` | 23 / 54 | 42.6% | 🟢 Deepened Line |
| `chocolates` | 34 / 84 | 40.5% | 🟢 Deepened Line |
| `homekitchen` | 24 / 67 | 35.8% | 🟢 Deepened Line |
| `munchies` | 30 / 85 | 35.3% | 🟢 Deepened Line |
| `breakfast` | 33 / 96 | 34.4% | 🟢 Deepened Line |
| `paan` | 13 / 41 | 31.7% | 🟢 Deepened Line |
| `tea` | 31 / 103 | 30.1% | 🟢 Deepened Line |
| `household` | 41 / 137 | 29.9% | 🟢 Deepened Line |
| `biscuits` | 24 / 83 | 28.9% | 🟢 Deepened Line |
| `dairy` | 21 / 85 | 24.7% | 🟡 Under 25% |
| `dryfruits` | 21 / 89 | 23.6% | 🟡 Under 25% |
| `oils` | 31 / 134 | 23.1% | 🟡 Under 25% |
| `instant` | 23 / 100 | 23.0% | 🟡 Under 25% |
| `staples` | 29 / 128 | 22.7% | 🟡 Under 25% |
| `personal` | 42 / 186 | 22.6% | 🟡 Under 25% |
| `drinks` | 27 / 123 | 22.0% | 🟡 Under 25% |
| `fruits` | 6 / 35 | 17.1% | 🟡 Under 25% |
| `pharma` | 19 / 119 | 16.0% | 🟡 Under 25% |
| `frozen` | 8 / 53 | 15.1% | 🟡 Under 25% |
| `vegetables` | 8 / 59 | 13.6% | 🟡 Under 25% |
| `baby` | 14 / 117 | 12.0% | 🟡 Under 25% |
| `stationery` | 0 / 60 | 0.0% | 🔴 Target Batch 6 |
| `beauty` | 0 / 60 | 0.0% | 🔴 Target Batch 6 |
| `pet` | 0 / 48 | 0.0% | 🔴 Target Batch 6 |
| `electronics` | 0 / 46 | 0.0% | 🔴 Target Batch 6 |

---

## 5. Batch 6 Roadmap: Zero-Aisle-Gap Elimination

The primary objective for **Batch 6** is to eliminate the final four 0% categories so that every aisle in Paaska has immediate visual presence:

### Priority Target 1: `stationery` (60 SKUs)
- Classmate Spiral & Bound Notebooks (172 pages / single line)
- Reynolds 045 / Cello Gripper Blue & Black Ball Pens (Pack of 5)
- Nataraj 621 Bold Pencils with Sharpener & Eraser
- Fevistik Super Glue Stick (15g) & Fevicol MR (50g)
- Camlin Mathematical Drawing Instruments / Geometry Box

### Priority Target 2: `beauty` (60 SKUs)
- Maybelline New York Colossal Kajal (Black)
- Nivea Original Care Lip Balm (4.8g)
- Ponds Cold Cream / White Beauty Daily Moisturizer (50g)
- Vaseline Original Pure Skin Jelly (42g / 85g)
- Lakme Eyeconic Liquid Eyeliner

### Priority Target 3: `pet` (48 SKUs)
- Pedigree Adult Dry Dog Food (Meat & Rice / Chicken & Vegetables - 1.2kg, 3kg)
- Whiskas Wet Cat Food Pouches (Tuna in Jelly - 85g)
- Drools Absolute Calcium Dog Bone Treats
- Me-O Creamy Cat Treats (Bonito Flavor)

### Priority Target 4: `electronics` (46 SKUs)
- Duracell Ultra Alkaline AA & AAA Batteries (Pack of 4)
- Portronics Fast Charging Type-C to USB Cable (1m, Braided)
- Mi / Ambrane 20W Fast USB Charger Adapter
- Anchor 3-Pin Multi-Plug Extension Adapter with Indicator

**Execution Metric:** Adding ~45 studio pack shots across these four lines will achieve **100% category breadth (0 zero-coverage categories)** and lift total platform coverage past 650+ mapped SKUs.
