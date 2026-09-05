/* eslint-disable */
/**
 * Deterministic generator for the "Bighi Brothers Mart" 1,000+ SKU master catalog.
 *
 * Run:  node scripts/gen-bighi-catalog.cjs
 * Out:  src/lib/bighiCatalog.ts
 *
 * The catalog is a *bundled* asset (imported by the customer flagship storefront
 * and the vendor master-catalog picker) so it renders instantly in every
 * environment — local dev, Arena preview and Vercel — with no backend/DB needed.
 *
 * SKUs are expanded from realistic brand x pack-size matrices per category,
 * so the result is a broad, authentic Indian quick-commerce assortment rather
 * than thin, repetitive filler. Every pack carries an explicit price multiplier
 * vs the line's base price `p`, so larger packs cost more (and MRP is a
 * deterministic 8–35% markup for a real strikethrough + discount badge).
 */

const fs = require('fs');
const path = require('path');

// ---- Category metadata (26 quick-commerce categories) ---------------------
const CATEGORIES = [
  { id: 'dairy',       label: 'Dairy, Bread & Eggs',  icon: 'egg',               from: '#38BDF8', to: '#0369A1' },
  { id: 'vegetables',  label: 'Fresh Vegetables',     icon: 'nutrition',         from: '#4ADE80', to: '#15803D' },
  { id: 'fruits',      label: 'Fresh Fruits',         icon: 'eco',               from: '#FB923C', to: '#C2410C' },
  { id: 'staples',     label: 'Atta, Rice & Dals',    icon: 'rice_bowl',         from: '#FACC15', to: '#A16207' },
  { id: 'oils',        label: 'Oils, Ghee & Spices',  icon: 'water_drop',        from: '#F87171', to: '#B91C1C' },
  { id: 'munchies',    label: 'Munchies & Namkeen',   icon: 'fastfood',          from: '#FB923C', to: '#C2410C' },
  { id: 'biscuits',    label: 'Biscuits & Bakery',    icon: 'cookie',            from: '#FBBF24', to: '#B45309' },
  { id: 'chocolates',  label: 'Chocolates & Sweets',  icon: 'candy',             from: '#D6A87F', to: '#7C3F12' },
  { id: 'drinks',      label: 'Cold Drinks & Juices', icon: 'local_drink',       from: '#38BDF8', to: '#075985' },
  { id: 'tea',         label: 'Tea, Coffee & Drinks', icon: 'coffee',            from: '#C49A6C', to: '#5B3413' },
  { id: 'instant',     label: 'Instant Food',         icon: 'ramen_dining',      from: '#F472B6', to: '#BE185D' },
  { id: 'household',   label: 'Cleaning & Household', icon: 'cleaning_services', from: '#2DD4BF', to: '#0F766E' },
  { id: 'personal',    label: 'Personal Care',        icon: 'health_and_beauty', from: '#C4B5FD', to: '#5B21B6' },
  { id: 'baby',        label: 'Baby Care & Wellness', icon: 'child_care',        from: '#5EEAD4', to: '#0F766E' },
  // ---- Expansion wave 2: gaps found vs Blinkit / Zepto / Instamart / JioMart.
  // See docs/CATEGORY-GAP-ANALYSIS.md for the reasoning behind each.
  { id: 'meat',        label: 'Chicken, Meat & Fish', icon: 'set_meal',          from: '#F87171', to: '#991B1B' },
  { id: 'breakfast',   label: 'Breakfast & Spreads',  icon: 'bakery_dining',     from: '#FBBF24', to: '#92400E' },
  { id: 'frozen',      label: 'Frozen Food & Ice Cream', icon: 'ac_unit',        from: '#7DD3FC', to: '#0C4A6E' },
  { id: 'dryfruits',   label: 'Dry Fruits & Makhana', icon: 'grain',             from: '#D6A87F', to: '#78350F' },
  { id: 'pharma',      label: 'Pharma & Wellness',    icon: 'medical_services',  from: '#4ADE80', to: '#166534' },
  { id: 'pooja',       label: 'Pooja & Festive Needs', icon: 'local_fire_department', from: '#FDBA74', to: '#9A3412' },
  { id: 'homekitchen', label: 'Home & Kitchen Needs', icon: 'lightbulb',         from: '#A5B4FC', to: '#3730A3' },
  { id: 'stationery',  label: 'Stationery & Office',  icon: 'edit',              from: '#93C5FD', to: '#1E40AF' },
  { id: 'beauty',      label: 'Beauty & Cosmetics',   icon: 'auto_awesome',      from: '#F9A8D4', to: '#9D174D' },
  { id: 'pet',         label: 'Pet Care',             icon: 'pets',              from: '#FCD34D', to: '#92400E' },
  { id: 'electronics', label: 'Electronics & Accessories', icon: 'cable',        from: '#94A3B8', to: '#1E293B' },
  { id: 'paan',        label: 'Paan Corner & Mouth Fresheners', icon: 'spa',     from: '#86EFAC', to: '#14532D' },
];

// Each item: n = product line, brands = pack brands (empty = loose/unbranded),
// packs = [label, price-multiplier-vs-base] pairs.
const CATALOG = {
  dairy: [
    { n: 'Fresh Toned Milk', brands: ['Amul Taaza', 'Mother Dairy', 'Nandini', 'DMS'], packs: [['500 ml pouch', 0.52], ['1 L pouch', 1], ['1 L tetra pak', 1.18]], p: 54 },
    { n: 'Full Cream Milk', brands: ['Amul Gold', 'Mother Dairy', 'Nandini'], packs: [['500 ml pouch', 0.55], ['1 L pouch', 1]], p: 66 },
    { n: 'Skimmed Milk', brands: ['Amul Slim', 'Mother Dairy'], packs: [['500 ml pouch', 0.55], ['1 L pouch', 1]], p: 50 },
    { n: 'Buffalo Milk', brands: ['Amul Buffalo', 'Mother Dairy'], packs: [['500 ml pouch', 0.55], ['1 L pouch', 1]], p: 70 },
    { n: 'Fresh Curd / Dahi', brands: ['Amul Masti', 'Mother Dairy', 'Nestle a+'], packs: [['200 g cup', 0.45], ['400 g tub', 0.8], ['1 kg tub', 1]], p: 70 },
    { n: 'Mishti Doi', brands: ['Amul', 'Mother Dairy'], packs: [['85 g cup', 0.4], ['250 g cup', 1]], p: 50 },
    { n: 'Butter', brands: ['Amul Butter', 'Mother Dairy'], packs: [['100 g pack', 0.45], ['500 g pack', 1]], p: 280 },
    { n: 'Malai Paneer', brands: ['Amul', 'Mother Dairy', 'Gowardhan'], packs: [['200 g pack', 0.45], ['1 kg pack', 1]], p: 360 },
    { n: 'Processed Cheese Slices', brands: ['Amul', 'Britannia'], packs: [['200 g', 0.5], ['400 g', 1]], p: 130 },
    { n: 'Cheese Block', brands: ['Amul', 'Britannia'], packs: [['200 g', 0.4], ['1 kg', 1]], p: 420 },
    { n: 'Brown Bread', brands: ['Britannia', 'Modern', 'Harvest Gold'], packs: [['400 g loaf', 1]], p: 45 },
    { n: 'White Sandwich Bread', brands: ['Britannia', 'Modern', 'Harvest Gold'], packs: [['400 g loaf', 0.7], ['800 g family loaf', 1]], p: 55 },
    { n: 'Whole Wheat Atta Bread', brands: ['Britannia', 'Harvest Gold'], packs: [['400 g loaf', 1]], p: 50 },
    { n: 'Pav Buns', brands: ['Harvest Gold', 'Modern'], packs: [['6 pcs pack', 1]], p: 35 },
    { n: 'Burger Buns', brands: ['Harvest Gold', 'Modern'], packs: [['4 pcs pack', 1]], p: 40 },
    { n: 'Fresh Farm Eggs', brands: ['Suguna', 'Venky’s', 'Local Farm'], packs: [['6 pcs', 0.45], ['12 pcs', 0.85], ['30 pcs tray', 1]], p: 240 },
    { n: 'Flavoured Milk', brands: ['Amul Kool', 'Mother Dairy'], packs: [['200 ml bottle', 1]], p: 30 },
    { n: 'Flavoured Yogurt Smoothie', brands: ['Amul Flaavyo', 'Epigamia'], packs: [['180 g cup', 1]], p: 40 },
  ],
  vegetables: [
    { n: 'Desi Tomato', brands: [], packs: [['500 g', 0.5], ['1 kg', 1], ['2 kg', 1.9]], p: 40 },
    { n: 'Hybrid Potato', brands: [], packs: [['500 g', 0.5], ['1 kg', 1], ['2 kg', 1.85], ['5 kg sack', 4.4]], p: 30 },
    { n: 'Red Onion', brands: [], packs: [['500 g', 0.5], ['1 kg', 1], ['2 kg', 1.9], ['5 kg sack', 4.5]], p: 35 },
    { n: 'Fresh Coriander Bunch', brands: [], packs: [['100 g bunch', 1], ['250 g', 2.3]], p: 20 },
    { n: 'Ginger Root', brands: [], packs: [['100 g', 0.5], ['250 g', 1], ['500 g', 1.9]], p: 80 },
    { n: 'Garlic Bulb', brands: [], packs: [['100 g', 0.5], ['250 g', 1], ['500 g', 1.85]], p: 90 },
    { n: 'Bhindi / Okra', brands: [], packs: [['250 g', 0.5], ['500 g', 1]], p: 60 },
    { n: 'Green Chilli', brands: [], packs: [['100 g', 0.5], ['250 g', 1]], p: 40 },
    { n: 'Curry Leaves', brands: [], packs: [['1 bunch', 1]], p: 15 },
    { n: 'Palak / Spinach', brands: [], packs: [['250 g bunch', 0.5], ['500 g', 1]], p: 30 },
    { n: 'Bottle Gourd / Lauki', brands: [], packs: [['1 pc ~700 g', 0.7], ['1 kg', 1]], p: 28 },
    { n: 'Ridge Gourd / Torai', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 32 },
    { n: 'Brinjal / Baingan', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 30 },
    { n: 'Cauliflower / Phool Gobi', brands: [], packs: [['1 pc ~600 g', 0.7], ['1 kg', 1]], p: 35 },
    { n: 'Cabbage / Patta Gobi', brands: [], packs: [['1 pc ~800 g', 0.7], ['1 kg', 1]], p: 25 },
    { n: 'Capsicum Green', brands: [], packs: [['250 g', 0.5], ['500 g', 1], ['1 kg', 1.9]], p: 60 },
    { n: 'Cucumber / Kheera', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 30 },
    { n: 'Carrot / Gajar', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 45 },
    { n: 'Beetroot', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 40 },
    { n: 'Drumstick / Sahjan', brands: [], packs: [['250 g', 0.55], ['500 g', 1]], p: 50 },
    { n: 'Bitter Gourd / Karela', brands: [], packs: [['500 g', 0.6], ['1 kg', 1]], p: 55 },
    { n: 'French Beans', brands: [], packs: [['250 g', 0.5], ['500 g', 1]], p: 70 },
    { n: 'Green Peas / Matar', brands: [], packs: [['250 g', 0.5], ['500 g', 1]], p: 80 },
    { n: 'Sweet Corn', brands: [], packs: [['1 pc', 0.5], ['2 pcs', 1]], p: 25 },
    { n: 'Pumpkin / Kaddu', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 25 },
    { n: 'Button Mushroom', brands: ['Dole Fresh', 'Local Farm'], packs: [['200 g pack', 1]], p: 65 },
  ],
  fruits: [
    { n: 'Robusta Banana', brands: [], packs: [['6 pcs', 0.55], ['12 pcs', 1]], p: 90 },
    { n: 'Shimla Apple', brands: [], packs: [['4 pcs ~700 g', 0.7], ['1 kg', 1], ['2 kg', 1.9]], p: 140 },
    { n: 'Mosambi / Sweet Lime', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 80 },
    { n: 'Pomegranate / Anar', brands: [], packs: [['1 pc', 0.45], ['500 g', 0.7], ['1 kg', 1]], p: 130 },
    { n: 'Papaya', brands: [], packs: [['1 pc ~1.2 kg', 1], ['1 kg', 0.7]], p: 45 },
    { n: 'Seedless Green Grapes', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 90 },
    { n: 'Black Grapes', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 110 },
    { n: 'Alphonso Mango', brands: [], packs: [['1 kg', 1], ['2 kg box', 1.95]], p: 250 },
    { n: 'Banarasi Langra Mango', brands: [], packs: [['1 kg', 1]], p: 120 },
    { n: 'Watermelon', brands: [], packs: [['1 slice', 0.2], ['1 pc ~4 kg', 1]], p: 60 },
    { n: 'Muskmelon / Kharbooja', brands: [], packs: [['1 pc ~1 kg', 1]], p: 50 },
    { n: 'Guava / Amrood', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 60 },
    { n: 'Orange / Nagpur Santra', brands: [], packs: [['4 pcs', 0.6], ['1 kg', 1]], p: 70 },
    { n: 'Kiwi', brands: ['Imported'], packs: [['2 pcs', 0.55], ['4 pcs pack', 1]], p: 120 },
    { n: 'Pineapple', brands: [], packs: [['1 pc ~1.5 kg', 1]], p: 70 },
    { n: 'Chikoo / Sapota', brands: [], packs: [['500 g', 0.55], ['1 kg', 1]], p: 70 },
    { n: 'Custard Apple / Sitaphal', brands: [], packs: [['500 g', 1]], p: 90 },
    { n: 'Strawberries', brands: ['Mahabaleshwar'], packs: [['200 g box', 1]], p: 120 },
    { n: 'Coconut / Nariyal', brands: [], packs: [['1 pc', 0.5], ['2 pcs', 1]], p: 35 },
  ],
  staples: [
    { n: 'Whole Wheat Chakki Atta', brands: ['Aashirvaad Shudh Chakki', 'Pillsbury', 'Fortune', 'Patanjali'], packs: [['1 kg pack', 0.25], ['5 kg bag', 1], ['10 kg bag', 1.9]], p: 260 },
    { n: 'Sharbati Wheat Atta', brands: ['Fortune Sharbati', 'Aashirvaad Select', 'Lokwan'], packs: [['5 kg bag', 1], ['10 kg bag', 1.85]], p: 320 },
    { n: 'Multigrain Atta', brands: ['Aashirvaad Multi', 'Pillsbury Multi'], packs: [['5 kg bag', 1]], p: 310 },
    { n: 'Basmati Rice', brands: ['India Gate Classic', 'Daawat Rozana', 'Kohinoor', 'Fortune'], packs: [['1 kg pack', 0.35], ['5 kg bag', 1], ['10 kg bag', 1.9]], p: 550 },
    { n: 'Sona Masoori Rice', brands: ['Fortune', 'India Gate', 'Local'], packs: [['1 kg', 0.24], ['5 kg bag', 1], ['10 kg bag', 1.9]], p: 420 },
    { n: 'Toor / Arhar Dal', brands: ['Tata Sampann', 'Tata I Shakti', '24 Mantra', 'Fortune'], packs: [['500 g', 0.52], ['1 kg pack', 1]], p: 170 },
    { n: 'Moong Dhuli Dal', brands: ['Tata Sampann', '24 Mantra', 'Fortune'], packs: [['500 g', 0.52], ['1 kg pack', 1]], p: 150 },
    { n: 'Chana Dal', brands: ['Tata Sampann', 'Fortune', '24 Mantra'], packs: [['500 g', 0.52], ['1 kg pack', 1]], p: 110 },
    { n: 'Masoor Dal', brands: ['Tata Sampann', 'Fortune'], packs: [['500 g', 0.52], ['1 kg pack', 1]], p: 105 },
    { n: 'Kabuli Chana / Chickpeas', brands: ['Tata Sampann', '24 Mantra'], packs: [['500 g', 0.52], ['1 kg pack', 1]], p: 130 },
    { n: 'Kala Chana', brands: ['Tata Sampann', 'Fortune'], packs: [['500 g', 0.52], ['1 kg pack', 1]], p: 95 },
    { n: 'Rajma Chitra', brands: ['Tata Sampann', '24 Mantra'], packs: [['500 g', 0.5], ['1 kg', 1]], p: 160 },
    { n: 'Urad Dhuli Dal', brands: ['Tata Sampann', 'Fortune'], packs: [['500 g', 0.52], ['1 kg', 1]], p: 145 },
    { n: 'Poha Flattened Rice', brands: ['Fortune', 'Local'], packs: [['500 g', 0.5], ['1 kg', 1]], p: 55 },
    { n: 'Sooji / Rava', brands: ['Aashirvaad', 'Fortune'], packs: [['500 g', 0.5], ['1 kg', 1]], p: 50 },
    { n: 'Maida', brands: ['Aashirvaad', 'Pillsbury'], packs: [['500 g', 0.5], ['1 kg', 1]], p: 45 },
    { n: 'Besan Gram Flour', brands: ['Tata Sampann', '24 Mantra', 'Fortune'], packs: [['500 g', 0.5], ['1 kg', 1]], p: 95 },
    { n: 'Pasta', brands: ['Maggi', 'Sunfeast YiPPee!', 'Bambino'], packs: [['400 g pack', 0.6], ['900 g family pack', 1]], p: 95 },
    { n: 'Sugar / Cheeni', brands: ['Madhur', 'Tata', 'Parry’s'], packs: [['1 kg pack', 0.22], ['5 kg bag', 1]], p: 230 },
    { n: 'Iodised Salt', brands: ['Tata Salt', 'Aashirvaad Salt'], packs: [['250 g', 0.3], ['1 kg pack', 1]], p: 24 },
    { n: 'Rock Salt / Sendha Namak', brands: ['Tata Salt', 'Patanjali', 'Local'], packs: [['500 g', 0.55], ['1 kg pack', 1]], p: 60 },
  ],
  oils: [
    { n: 'Refined Sunflower Oil', brands: ['Fortune Sunlite', 'Saffola', 'Dhara', 'Nature Fresh'], packs: [['1 L pouch', 0.55], ['1 L jar', 0.6], ['5 L jar', 1], ['15 L tin', 2.8]], p: 720 },
    { n: 'Kachi Ghani Mustard Oil', brands: ['Engine', 'Fortune', 'Dhara', 'Patanjali'], packs: [['1 L pouch', 0.55], ['1 L bottle', 0.6], ['5 L jar', 1]], p: 620 },
    { n: 'Refined Soyabean Oil', brands: ['Fortune', 'Saffola'], packs: [['1 L pouch', 0.55], ['5 L jar', 1]], p: 600 },
    { n: 'Groundnut Oil', brands: ['Fortune', '24 Mantra', 'Patanjali'], packs: [['1 L bottle', 0.55], ['5 L jar', 1]], p: 900 },
    { n: 'Extra Virgin Olive Oil', brands: ['Bertolli', 'Figaro', 'Borges'], packs: [['250 ml', 0.4], ['1 L bottle', 1]], p: 1100 },
    { n: 'Rice Bran Oil', brands: ['Fortune Rice Bran', 'Dhara'], packs: [['1 L', 0.55], ['5 L', 1]], p: 680 },
    { n: 'Cow Ghee', brands: ['Amul Cow Ghee', 'Nestle a+', 'Mother Dairy'], packs: [['200 ml', 0.26], ['500 ml', 0.55], ['1 L jar', 1]], p: 650 },
    { n: 'Buffalo Desi Ghee', brands: ['Amul', 'Patanjali', 'Aashirvaad Svasti'], packs: [['500 ml', 0.55], ['1 L jar', 1]], p: 720 },
    { n: 'Vanaspati / Dalda', brands: ['Dalda', 'Rath'], packs: [['500 ml', 0.35], ['1 L', 0.6]], p: 220 },
    { n: 'Deggi Mirch Chilli Powder', brands: ['MDH', 'Everest', 'Catch'], packs: [['100 g', 0.4], ['200 g', 0.7], ['500 g', 1]], p: 160 },
    { n: 'Garam Masala', brands: ['MDH', 'Everest', 'Catch'], packs: [['100 g', 0.4], ['200 g', 1]], p: 95 },
    { n: 'Haldi / Turmeric Powder', brands: ['Tata', 'MDH', '24 Mantra'], packs: [['100 g', 0.4], ['200 g', 0.75], ['500 g', 1]], p: 130 },
    { n: 'Dhania / Coriander Powder', brands: ['MDH', 'Everest', 'Catch'], packs: [['100 g', 0.4], ['200 g', 0.75], ['500 g', 1]], p: 120 },
    { n: 'Jeera / Cumin Seeds', brands: ['MDH', 'Tata Sampann', 'Catch'], packs: [['100 g', 0.5], ['200 g', 1]], p: 110 },
    { n: 'Kitchen King Masala', brands: ['MDH', 'Everest'], packs: [['100 g', 0.55], ['200 g', 1]], p: 135 },
    { n: 'Chana Masala Powder', brands: ['MDH', 'Everest'], packs: [['100 g', 0.55], ['200 g', 1]], p: 130 },
    { n: 'Sambar Masala', brands: ['MTR', 'MDH'], packs: [['100 g', 0.55], ['200 g', 1]], p: 145 },
    { n: 'Chat Masala', brands: ['MDH', 'Everest', 'Catch'], packs: [['100 g', 0.55], ['200 g', 1]], p: 110 },
    { n: 'Black Pepper Powder', brands: ['Catch', 'MDH', 'Tata'], packs: [['100 g', 0.55], ['200 g', 1]], p: 165 },
    { n: 'Kasuri Methi', brands: ['MDH', 'Everest'], packs: [['50 g', 0.55], ['100 g', 1]], p: 85 },
  ],
  munchies: [
    { n: 'Magic Masala Chips', brands: ['Lay’s', 'Ruffles'], packs: [['52 g', 0.4], ['78 g family', 0.6], ['157 g party', 1]], p: 50 },
    { n: 'Masala Munch Namkeen', brands: ['Kurkure', 'Haldiram’s'], packs: [['85 g', 0.62], ['150 g', 1]], p: 32 },
    { n: 'Aloo Bhujia', brands: ['Haldiram’s', 'Bikaji', 'Bikharam'], packs: [['200 g', 0.5], ['400 g', 1], ['1 kg', 2.2]], p: 130 },
    { n: 'Classic Salted Chips', brands: ['Lay’s', 'Uncle Chipps'], packs: [['52 g', 0.4], ['157 g party', 1]], p: 50 },
    { n: 'Nacho Tortilla Chips', brands: ['Doritos', 'Cornitos'], packs: [['100 g', 0.7], ['150 g', 1]], p: 40 },
    { n: 'Moong Dal', brands: ['Haldiram’s', 'Bikaji'], packs: [['200 g', 0.55], ['400 g', 1]], p: 55 },
    { n: 'Navratan Mixture', brands: ['Haldiram’s', 'Bikaji'], packs: [['200 g', 0.3], ['400 g', 0.55], ['1 kg', 1]], p: 120 },
    { n: 'Bhujiya Sev', brands: ['Haldiram’s', 'Bikharam'], packs: [['200 g', 0.55], ['400 g', 1]], p: 60 },
    { n: 'Peanut Chikki', brands: ['Haldiram’s', 'Jabsons'], packs: [['200 g', 0.45], ['500 g', 1]], p: 70 },
    { n: 'Roasted Peanuts', brands: ['Haldiram’s', 'Jabsons'], packs: [['200 g', 0.5], ['400 g', 1]], p: 80 },
    { n: 'Salted Popcorn', brands: ['Act II', 'Haldiram’s'], packs: [['70 g', 0.6], ['150 g', 1]], p: 30 },
    { n: 'Cheese Balls', brands: ['Corn Puffs', 'Cheetos'], packs: [['60 g', 0.55], ['120 g', 1]], p: 20 },
    { n: 'Potato Wafers Salted', brands: ['Haldiram’s', 'Uncle Chipps'], packs: [['150 g', 0.5], ['300 g', 1]], p: 60 },
    { n: 'Chana Jor Garam', brands: ['Haldiram’s', 'Bikaji'], packs: [['200 g', 0.55], ['400 g', 1]], p: 65 },
    { n: 'Mathri', brands: ['Haldiram’s', 'Bikaji'], packs: [['200 g', 0.55], ['400 g', 1]], p: 70 },
    { n: 'Khatta Meetha Namkeen', brands: ['Haldiram’s'], packs: [['200 g', 0.55], ['400 g', 1]], p: 60 },
    { n: 'Pani Puri Kit', brands: ['Haldiram’s', 'Bikaji'], packs: [['240 g', 1]], p: 60 },
    { n: 'Roasted Almonds', brands: ['Jabsons', 'Haldiram’s'], packs: [['200 g', 0.5], ['400 g', 1]], p: 220 },
    { n: 'Cashew Nuts', brands: ['Haldiram’s', 'Jabsons'], packs: [['200 g', 0.45], ['500 g', 1]], p: 320 },
    { n: 'Green Chilli Pickle', brands: ['Mother’s Recipe', 'Nilons'], packs: [['200 g', 0.55], ['400 g', 1]], p: 70 },
  ],
  biscuits: [
    { n: 'Gold Glucose Biscuits', brands: ['Parle-G Gold', 'Parle-G'], packs: [['100 g', 0.18], ['250 g', 0.4], ['1 kg family', 1]], p: 110 },
    { n: 'Cashew Cookies', brands: ['Britannia Good Day', 'Sunfeast'], packs: [['100 g', 0.28], ['250 g', 0.55], ['600 g', 1]], p: 90 },
    { n: 'Marie Gold Biscuits', brands: ['Britannia Marie Gold', 'Parle Marie'], packs: [['100 g', 0.25], ['250 g', 0.5], ['600 g', 1]], p: 85 },
    { n: 'Choco Fills Cookies', brands: ['Sunfeast Dark Fantasy', 'Cadbury Bournvita Biscuits'], packs: [['75 g', 0.5], ['300 g', 1]], p: 80 },
    { n: 'Chocolate Cream Biscuit', brands: ['Oreo', 'Cadbury Oreo'], packs: [['120 g', 0.5], ['300 g family', 1]], p: 70 },
    { n: 'Suji Rusk', brands: ['Britannia Toastea', 'Parle Rusk', 'Modern'], packs: [['200 g', 0.4], ['400 g', 0.75], ['600 g', 1]], p: 60 },
    { n: 'Butter Bake Biscuits', brands: ['Britannia Butter Bake', 'Parle Hide & Seek'], packs: [['100 g', 0.4], ['250 g', 1]], p: 35 },
    { n: 'Krackjack Sweet & Salty', brands: ['Parle Krackjack'], packs: [['100 g', 0.25], ['250 g', 0.5], ['600 g', 1]], p: 80 },
    { n: 'Monaco Salted Biscuits', brands: ['Parle Monaco'], packs: [['100 g', 0.4], ['250 g', 1]], p: 35 },
    { n: '50-50 Sweet Salty', brands: ['Britannia 50-50'], packs: [['100 g', 0.25], ['250 g', 0.5], ['600 g', 1]], p: 80 },
    { n: 'Treat Cream Biscuits', brands: ['Britannia Treat', 'Sunfeast Bounce'], packs: [['120 g', 0.45], ['300 g', 1]], p: 70 },
    { n: 'Milk Bikis', brands: ['Britannia Milk Bikis'], packs: [['100 g', 0.4], ['250 g', 1]], p: 35 },
    { n: 'NutriChoice Digestive', brands: ['Britannia NutriChoice'], packs: [['100 g', 0.2], ['250 g', 0.4], ['1 kg', 1]], p: 110 },
    { n: 'Oats Cookies', brands: ['Sunfeast Farmlite', 'McVities'], packs: [['150 g', 0.35], ['600 g', 1]], p: 60 },
    { n: 'Cream Wafers', brands: ['Britannia Treat Wafers', 'Dukes Waffy'], packs: [['150 g', 0.5], ['300 g', 1]], p: 45 },
    { n: 'Whole Wheat Digestive', brands: ['McVities', 'Sunfeast Farmlite'], packs: [['200 g', 0.35], ['600 g', 1]], p: 60 },
    { n: 'Cake / Brownie', brands: ['Britannia Cakes', 'Monginis'], packs: [['45 g', 0.4], ['120 g pack', 1]], p: 30 },
    { n: 'Puff Pastry Snack', brands: ['Haldiram’s', 'Pillsbury'], packs: [['200 g', 1]], p: 50 },
    { n: 'Khari Biscuit', brands: ['Modern', 'Local Bakery'], packs: [['200 g', 0.55], ['400 g', 1]], p: 55 },
    { n: 'Nankhatai', brands: ['Haldiram’s', 'Local Bakery'], packs: [['200 g', 0.55], ['400 g', 1]], p: 70 },
  ],
  chocolates: [
    { n: 'Silk Chocolate Bar', brands: ['Cadbury Dairy Milk Silk', 'Cadbury Dairy Milk'], packs: [['60 g', 0.7], ['150 g', 1.4], ['250 g gift', 2.3]], p: 95 },
    { n: 'Crispy Wafer Chocolate', brands: ['KitKat', 'Nestle KitKat'], packs: [['37.3 g', 0.32], ['4-pack 8 fingers', 1]], p: 125 },
    { n: 'Caramel Chocolate Bar', brands: ['5 Star', 'Cadbury Fuse'], packs: [['40 g', 0.2], ['6 pack', 1]], p: 150 },
    { n: 'Premium Hazelnut Box', brands: ['Ferrero Rocher', 'Ferrero Mon Chéri'], packs: [['5 pcs', 0.42], ['16 pcs box', 1]], p: 840 },
    { n: 'Gulab Jamun Tin', brands: ['Haldiram’s', 'MTR', 'Bikaji'], packs: [['500 g tin', 0.55], ['1 kg tin', 1]], p: 180 },
    { n: 'Rasgulla Tin', brands: ['Haldiram’s', 'MTR', 'Bikaji'], packs: [['500 g tin', 0.55], ['1 kg tin', 1]], p: 170 },
    { n: 'Milk Chocolate Bar', brands: ['Nestle Milkybar', 'Amul Milk'], packs: [['40 g', 0.6], ['100 g', 1]], p: 45 },
    { n: 'Dark Chocolate', brands: ['Amul Dark', 'Cadbury Bournville'], packs: [['55 g', 0.6], ['150 g', 1]], p: 80 },
    { n: 'Chewing Gum Jar', brands: ['Orbit', 'Center Fresh'], packs: [['20 pcs', 0.6], ['33 pcs jar', 1]], p: 100 },
    { n: 'Lollipop', brands: ['Alpenliebe', 'Juzt Jelly'], packs: [['10 pcs', 0.4], ['bag of 30', 1]], p: 60 },
    { n: 'Toffee Jar', brands: ['Alpenliebe Gold', 'Melody', 'Mango Bite'], packs: [['jar ~100 pcs', 1]], p: 150 },
    { n: 'Gems Sugar Buttons', brands: ['Cadbury Gems'], packs: [['28.8 g', 0.3], ['100 g pack', 1]], p: 40 },
    { n: 'Soan Papdi', brands: ['Haldiram’s', 'Bikaji'], packs: [['250 g', 0.55], ['500 g', 1]], p: 90 },
    { n: 'Motichoor Laddoo', brands: ['Haldiram’s', 'Bikharam'], packs: [['250 g', 0.55], ['500 g', 1]], p: 110 },
    { n: 'Chocolate Syrup', brands: ['Hershey’s', 'Cadbury'], packs: [['200 ml', 0.45], ['623 g bottle', 1]], p: 150 },
    { n: 'Hazelnut Spread', brands: ['Nutella', 'Jus’ Amazin'], packs: [['350 g', 0.55], ['750 g', 1]], p: 420 },
    { n: 'Ice Cream Tub', brands: ['Amul', 'Kwality Walls', 'Mother Dairy'], packs: [['700 ml tub', 0.7], ['1.25 L family', 1]], p: 250 },
    { n: 'Choco Bar Ice Cream', brands: ['Kwality Walls', 'Amul'], packs: [['single', 0.3], ['4 pack', 1]], p: 40 },
    { n: 'Candy Bar Multipack', brands: ['Snickers', 'Mars', 'Bounty'], packs: [['45 g', 0.13], ['12 pack box', 1]], p: 380 },
    { n: 'Rasmalai Tin', brands: ['Haldiram’s', 'MTR'], packs: [['500 g tin', 0.55], ['1 kg tin', 1]], p: 190 },
  ],
  drinks: [
    { n: 'Cola Soft Drink', brands: ['Coca-Cola', 'Thums Up', 'Pepsi'], packs: [['750 ml', 0.65], ['1.25 L', 1], ['2 L family', 1.5]], p: 60 },
    { n: 'Lime Soft Drink', brands: ['Sprite', '7Up', 'Mountain Dew'], packs: [['750 ml', 0.65], ['1.25 L', 1], ['2 L', 1.5]], p: 60 },
    { n: 'Mango Drink', brands: ['Maaza', 'Frooti', 'Slice'], packs: [['150 ml tetra', 0.3], ['600 ml', 1], ['1.2 L', 1.8]], p: 45 },
    { n: 'Fruit Juice', brands: ['Real Fruit Power', 'Tropicana', 'B Natural'], packs: [['200 ml', 0.3], ['1 L carton', 1]], p: 110 },
    { n: 'Energy Drink', brands: ['Red Bull', 'Sting', 'Monster'], packs: [['250 ml can', 1], ['4 pack', 3.6]], p: 125 },
    { n: 'Packaged Water', brands: ['Bisleri', 'Aquafina', 'Kinley'], packs: [['1 L bottle', 0.18], ['2 L', 0.3], ['5 L jar', 0.65], ['20 L can', 1]], p: 120 },
    { n: 'Sparkling Soda', brands: ['Campa Cola', 'Bisleri Soda'], packs: [['600 ml', 0.7], ['750 ml', 1]], p: 30 },
    { n: 'Aerated Drink Can', brands: ['Coca-Cola', 'Thums Up', 'Sprite'], packs: [['300 ml can', 0.18], ['6 pack', 1]], p: 220 },
    { n: 'Orange Fizzy Drink', brands: ['Mirinda', 'Fanta'], packs: [['750 ml', 0.65], ['1.25 L', 1]], p: 60 },
    { n: 'Jeera Masala Soda', brands: ['Paper Boat', 'Campa', 'Local'], packs: [['250 ml', 0.5], ['600 ml', 1]], p: 30 },
    { n: 'Aam Panna', brands: ['Paper Boat', 'Local'], packs: [['200 ml', 0.3], ['1 L', 1]], p: 60 },
    { n: 'Buttermilk / Chaas', brands: ['Amul Chhach', 'Mother Dairy'], packs: [['200 ml', 0.25], ['1 L', 1]], p: 35 },
    { n: 'Lassi Sweet', brands: ['Amul', 'Mother Dairy'], packs: [['200 ml', 0.45], ['500 ml', 1]], p: 40 },
    { n: 'Tender Coconut Water', brands: ['Coco', 'Real'], packs: [['200 ml', 0.4], ['1 L', 1]], p: 50 },
    { n: 'Coconut Water Tetra', brands: ['Cocojal', 'Real'], packs: [['200 ml', 0.18], ['6 pack', 1]], p: 180 },
    { n: 'Soft Drink Mix', brands: ['Rasna', 'Glucon-D'], packs: [['makes 750 ml', 0.6], ['500 g jar', 1]], p: 120 },
    { n: 'Club Soda', brands: ['Bisleri', 'Kinley'], packs: [['750 ml', 1]], p: 25 },
    { n: 'Diet Soft Drink', brands: ['Coke Zero', 'Sprite Zero', 'Pepsi Black'], packs: [['300 ml can', 0.5], ['750 ml', 1]], p: 60 },
    { n: 'Lemon Barley', brands: ['Paper Boat', 'Real'], packs: [['200 ml', 0.3], ['1 L', 1]], p: 65 },
  ],
  tea: [
    { n: 'Premium Leaf Tea', brands: ['Tata Tea Gold', 'Tata Agni', 'Red Label', 'Tetley'], packs: [['250 g', 0.45], ['500 g', 0.85], ['1 kg', 1]], p: 280 },
    { n: 'Strong CTC Tea', brands: ['Brooke Bond Red Label', 'Society', 'Wagh Bakri'], packs: [['250 g', 0.45], ['500 g', 0.85], ['1 kg', 1]], p: 250 },
    { n: 'Green Tea', brands: ['Tetley Green', 'Lipton', 'Organic India'], packs: [['25 bags', 0.5], ['100 bags', 1]], p: 180 },
    { n: 'Instant Coffee Classic', brands: ['Nescafe Classic', 'Nescafe Sunrise'], packs: [['50 g jar', 0.4], ['100 g jar', 0.75], ['200 g', 1]], p: 240 },
    { n: 'Premium Instant Coffee', brands: ['Bru Gold', 'Bru Instant', 'Continental'], packs: [['50 g', 0.4], ['100 g', 0.75], ['200 g', 1]], p: 220 },
    { n: 'Coffee Beans / Filter', brands: ['Blue Tokai', 'Sleepy Owl', 'Nescafe'], packs: [['200 g', 0.5], ['500 g', 1]], p: 350 },
    { n: 'Chocolate Health Drink', brands: ['Bournvita', 'Horlicks', 'Complan'], packs: [['200 g', 0.4], ['500 g', 0.85], ['1 kg jar', 1]], p: 420 },
    { n: 'Milk Mix Powder', brands: ['Horlicks', 'Boost', 'Maltova'], packs: [['500 g', 0.6], ['1 kg', 1]], p: 380 },
    { n: 'Immunity Kadha Mix', brands: ['Organic India', 'Patanjali'], packs: [['100 g', 0.5], ['250 g', 1]], p: 120 },
    { n: 'Lemon Tea Premix', brands: ['Lipton', 'Tata Tea'], packs: [['10 sachets', 0.5], ['20 sachets', 1]], p: 90 },
    { n: 'Ginger Tea Premix', brands: ['Tata Tea Chaska', 'Red Label'], packs: [['10 sachets', 1]], p: 90 },
    { n: 'Cardamom Tea', brands: ['Wagh Bakri', 'Society'], packs: [['250 g', 0.55], ['500 g', 1]], p: 200 },
    { n: 'Masala Chai Tea', brands: ['Tata Tea Masala', 'Red Label Natural'], packs: [['250 g', 0.55], ['500 g', 1]], p: 210 },
    { n: 'Hot Chocolate Mix', brands: ['Cadbury', 'Hershey’s'], packs: [['200 g', 0.5], ['500 g', 1]], p: 250 },
    { n: 'Glucose Energy Powder', brands: ['Glucon-D', 'Electrol'], packs: [['200 g', 0.35], ['1 kg jar', 1]], p: 150 },
    { n: 'ORS Electrolyte', brands: ['Electral', 'Glucon-D'], packs: [['4 sachets', 0.4], ['20 sachets', 1]], p: 120 },
    { n: 'Badam Milk Mix', brands: ['MTR', 'Haldiram’s'], packs: [['200 g', 0.5], ['500 g', 1]], p: 200 },
  ],
  instant: [
    { n: '2-Minute Masala Noodles', brands: ['Maggi', 'Sunfeast YiPPee!', 'Knorr'], packs: [['70 g', 0.09], ['4 pack', 0.36], ['12 pack family', 1]], p: 168 },
    { n: 'Cup Noodles', brands: ['Maggi Cuppa Mania', 'Yippee Cup'], packs: [['70 g cup', 0.3], ['4 cup pack', 1]], p: 60 },
    { n: 'Cheesy Pasta Snack', brands: ['Maggi Pazzta', 'Sunfeast YiPPee! Pasta'], packs: [['65 g', 0.3], ['4 pack', 1]], p: 55 },
    { n: 'Instant Soup', brands: ['Knorr', 'Ching’s Secret', 'Maggi'], packs: [['4 sachets', 0.45], ['10 sachets', 1]], p: 60 },
    { n: 'Tomato Ketchup', brands: ['Kissan', 'Heinz', 'Maggi'], packs: [['200 g', 0.5], ['500 g', 1], ['1 kg', 1.9]], p: 120 },
    { n: 'Green Chilli Sauce', brands: ['Ching’s Secret', 'Knorr'], packs: [['200 g', 0.5], ['450 g', 1]], p: 70 },
    { n: 'Soy Sauce', brands: ['Ching’s Secret', 'Kikkoman'], packs: [['200 g', 0.4], ['750 g', 1]], p: 75 },
    { n: 'Schezwan Chutney', brands: ['Ching’s Secret', 'Kissan'], packs: [['250 g', 0.55], ['500 g', 1]], p: 80 },
    { n: 'Ready-to-Eat Curry', brands: ['MTR', 'Haldiram’s', 'Kohinoor'], packs: [['300 g pack', 0.3], ['4 pack', 1]], p: 130 },
    { n: 'Instant Upma Mix', brands: ['MTR', 'Haldiram’s'], packs: [['180 g', 0.3], ['4 pack', 1]], p: 70 },
    { n: 'Instant Poha Mix', brands: ['MTR', 'Haldiram’s'], packs: [['180 g', 0.3], ['4 pack', 1]], p: 70 },
    { n: 'Ready Dosa Batter', brands: ['ID Fresh', 'Haldiram’s'], packs: [['500 g', 0.55], ['1 kg', 1]], p: 80 },
    { n: 'Idli Dosa Instant Mix', brands: ['MTR', 'Gits'], packs: [['200 g', 0.45], ['500 g', 1]], p: 70 },
    { n: 'Gulab Jamun Mix', brands: ['MTR', 'Gits', 'Haldiram’s'], packs: [['200 g', 0.45], ['500 g', 1]], p: 75 },
    { n: 'Pav Bhaji Masala Base', brands: ['MTR', 'Haldiram’s'], packs: [['300 g', 0.55], ['600 g', 1]], p: 90 },
    { n: 'Noodles Masala Pack', brands: ['Maggi', 'Knorr'], packs: [['140 g pack', 0.16], ['8 pack', 1]], p: 120 },
    { n: 'Mayonnaise', brands: ['Dr. Oetker', 'FunFoods', 'Del Monte'], packs: [['250 g', 0.5], ['500 g', 1]], p: 110 },
    { n: 'Pasta Sauce', brands: ['Dr. Oetker', 'Knorr', 'Maggi'], packs: [['350 g', 0.55], ['700 g', 1]], p: 130 },
  ],
  household: [
    { n: 'Matic Detergent Powder', brands: ['Surf Excel Matic', 'Ariel Matic', 'Tide Matic'], packs: [['1 kg', 0.6], ['2 kg', 1], ['4 kg', 1.9]], p: 350 },
    { n: 'Top-Load Detergent', brands: ['Surf Excel', 'Ariel', 'Ghadi'], packs: [['1 kg', 0.45], ['4 kg', 1]], p: 220 },
    { n: 'Liquid Detergent', brands: ['Surf Excel Matic Liquid', 'Ariel Liquid', 'Henko'], packs: [['1 L', 0.6], ['2 L', 1]], p: 320 },
    { n: 'Dishwash Gel', brands: ['Vim Gel', 'Pril', 'Exo'], packs: [['500 ml', 0.5], ['750 ml', 0.7], ['1.5 L', 1]], p: 140 },
    { n: 'Dishwash Bar', brands: ['Vim', 'Exo', 'Pril'], packs: [['200 g bar', 0.35], ['3 pack', 0.8], ['5 pack', 1]], p: 120 },
    { n: 'Toilet Cleaner', brands: ['Harpic Power Plus', 'Lizol'], packs: [['500 ml', 0.55], ['1 L', 1]], p: 110 },
    { n: 'Floor Cleaner', brands: ['Lizol', 'Colin', 'Domex'], packs: [['500 ml', 0.5], ['1 L', 0.8], ['2 L', 1]], p: 175 },
    { n: 'Surface Disinfectant', brands: ['Dettol', 'Lizol'], packs: [['500 ml', 0.55], ['1 L', 1]], p: 160 },
    { n: 'Glass Cleaner', brands: ['Colin', 'Cif'], packs: [['500 ml spray', 1]], p: 80 },
    { n: 'Scrub Pad', brands: ['Scotch-Brite', 'Vim'], packs: [['2 pcs', 0.6], ['3 pack', 1]], p: 45 },
    { n: 'Mosquito Repellent Refill', brands: ['Good Knight', 'AllOut', 'Hit'], packs: [['45 ml refill', 0.55], ['2 refill pack', 0.9], ['machine + refill', 1]], p: 95 },
    { n: 'Mosquito Coil', brands: ['Good Knight', 'Mortein'], packs: [['10 pcs coil', 1]], p: 60 },
    { n: 'Mosquito Repellent Spray', brands: ['Hit', 'Good Knight'], packs: [['250 ml', 0.45], ['625 ml', 1]], p: 110 },
    { n: 'Room Freshener', brands: ['Godrej Aer', 'Odonil', 'Ambipur'], packs: [['gel pack', 0.6], ['270 ml spray', 1]], p: 140 },
    { n: 'Toilet Paper Roll', brands: ['Origami', 'Selpak', 'Premier'], packs: [['6 rolls', 0.55], ['12 rolls', 1]], p: 220 },
    { n: 'Tissue Paper Box', brands: ['Origami', 'Premier'], packs: [['100 pulls', 0.3], ['2 pack', 0.55], ['4 pack', 1]], p: 130 },
    { n: 'Kitchen Roll Towel', brands: ['Origami', 'Scott'], packs: [['2 rolls', 0.5], ['4 rolls', 1]], p: 130 },
    { n: 'Garbage Bags', brands: ['Origami', 'Mint Fresh'], packs: [['30 bags small', 0.7], ['30 bags large', 1]], p: 120 },
    { n: 'Aluminium Foil', brands: ['Hindalco', 'Reynolds'], packs: [['9 m', 0.4], ['25 m roll', 1]], p: 95 },
    { n: 'Cling Wrap', brands: ['Reynolds', 'Oddy'], packs: [['30 m roll', 1]], p: 80 },
    { n: 'Broom / Phool Jhadu', brands: ['Monkey 555', 'Local'], packs: [['1 pc', 1]], p: 70 },
    { n: 'Mop with Refill', brands: ['Scotch-Brite', 'Gala'], packs: [['1 set', 1]], p: 350 },
  ],
  personal: [
    { n: 'Germ Protection Soap', brands: ['Dettol Original', 'Lifebuoy', 'Savlon'], packs: [['75 g', 0.4], ['125 g', 0.65], ['4 pack', 1]], p: 180 },
    { n: 'Beauty Bathing Bar', brands: ['Dove Cream Bar', 'Pears', 'Lux'], packs: [['100 g', 0.35], ['3 pack', 0.8], ['4 pack', 1]], p: 130 },
    { n: 'Anti-Dandruff Shampoo', brands: ['Head & Shoulders', 'Clinic Plus', 'Dove'], packs: [['180 ml', 0.55], ['340 ml', 0.8], ['650 ml', 1]], p: 300 },
    { n: 'Shampoo', brands: ['Sunsilk', 'Dove', 'Clinic Plus'], packs: [['180 ml', 0.5], ['340 ml', 0.8], ['650 ml', 1]], p: 260 },
    { n: 'Strong Teeth Toothpaste', brands: ['Colgate Strong Teeth', 'Pepsodent', 'Sensodyne'], packs: [['100 g', 0.4], ['200 g', 0.7], ['300 g', 1]], p: 110 },
    { n: 'Toothbrush', brands: ['Colgate', 'Oral-B', 'Sensodyne'], packs: [['1 pc', 0.3], ['4 pack soft', 1]], p: 60 },
    { n: 'Manual Razor', brands: ['Gillette', '7 O’clock'], packs: [['1 razor', 0.5], ['4 cartridge', 1]], p: 120 },
    { n: 'Shaving Cream', brands: ['Gillette', 'Old Spice'], packs: [['70 g', 0.45], ['196 g', 1]], p: 90 },
    { n: 'Shaving Foam', brands: ['Gillette', 'Old Spice', 'Park Avenue'], packs: [['200 ml', 1], ['300 ml', 1.4]], p: 210 },
    { n: 'Beard Oil', brands: ['Beardo', 'Ustraa'], packs: [['30 ml', 0.65], ['50 ml', 1]], p: 250 },
    { n: 'Face Wash', brands: ['Himalaya', 'Garnier', 'Nivea'], packs: [['50 ml', 0.4], ['100 ml', 0.65], ['200 ml', 1]], p: 140 },
    { n: 'Moisturising Cream', brands: ['Nivea', 'Ponds', 'Dove'], packs: [['100 ml', 0.45], ['250 ml', 0.7], ['400 ml', 1]], p: 180 },
    { n: 'Sunscreen Lotion', brands: ['Lakme', 'Lotus', 'Mamaearth'], packs: [['50 ml', 0.5], ['100 ml', 1]], p: 260 },
    { n: 'Body Lotion', brands: ['Nivea', 'Vaseline', 'Parachute'], packs: [['100 ml', 0.3], ['400 ml', 0.7], ['600 ml', 1]], p: 220 },
    { n: 'Hair Oil', brands: ['Parachute Coconut', 'Bajaj Almond', 'Dabur Amla'], packs: [['100 ml', 0.3], ['300 ml', 0.65], ['500 ml', 1]], p: 120 },
    { n: 'Deodorant Spray', brands: ['Axe', 'Nivea', 'Engage', 'Fogg'], packs: [['150 ml', 0.8], ['200 ml', 1]], p: 200 },
    { n: 'Perfume', brands: ['Fogg', 'Axe', 'Engage'], packs: [['100 ml', 0.7], ['150 ml', 1]], p: 250 },
    { n: 'Hand Wash', brands: ['Dettol', 'Lifebuoy', 'Santoor'], packs: [['215 ml', 0.35], ['750 ml refill', 1]], p: 110 },
    { n: 'Sanitary Pads', brands: ['Whisper', 'Stayfree', 'Sofy'], packs: [['15 pads', 0.45], ['30 pads', 0.85], ['40 XL pads', 1]], p: 180 },
    { n: 'Face Cream', brands: ['Ponds', 'Lakme', 'Olay'], packs: [['50 g', 0.5], ['100 g', 1]], p: 220 },
    { n: 'Talcum Powder', brands: ['Ponds', 'Yardley', 'Dermi Cool'], packs: [['100 g', 0.4], ['300 g', 1]], p: 120 },
    { n: 'Hair Conditioner', brands: ['Dove', 'Sunsilk', 'TRESemme'], packs: [['80 ml', 0.35], ['335 ml', 1]], p: 180 },
    { n: 'Nail Grooming Kit', brands: ['Gubb', 'Beardo'], packs: [['1 set', 1]], p: 150 },
  ],
  baby: [
    { n: 'Diapers Pants', brands: ['Pampers', 'MamyPoko', 'Huggies'], packs: [['S · 20 pcs', 0.85], ['M · 36 pcs', 1], ['L · 34 pcs', 1.05], ['XL · 30 pcs', 1.15]], p: 550 },
    { n: 'Baby Wipes', brands: ['Pampers', 'MamyPoko', 'Johnson’s'], packs: [['20 wipes', 0.3], ['72 wipes pack', 1]], p: 120 },
    { n: 'Baby Soap', brands: ['Johnson’s Baby', 'Sebamed', 'Himalaya'], packs: [['75 g', 0.4], ['125 g', 0.6], ['4 pack', 1]], p: 130 },
    { n: 'Baby Shampoo', brands: ['Johnson’s', 'Sebamed', 'Himalaya'], packs: [['100 ml', 0.55], ['200 ml', 1]], p: 160 },
    { n: 'Baby Lotion', brands: ['Johnson’s', 'Sebamed', 'Himalaya'], packs: [['100 ml', 0.35], ['200 ml', 0.55], ['500 ml', 1]], p: 200 },
    { n: 'Diaper Rash Cream', brands: ['B4 Nappi', 'Sebamed', 'Himalaya'], packs: [['50 g', 0.55], ['100 g', 1]], p: 150 },
    { n: 'Infant Cereal', brands: ['Nestle Cerelac', 'Nestum'], packs: [['300 g', 0.75], ['400 g Stage 1', 1], ['400 g Stage 2', 1]], p: 280 },
    { n: 'Baby Formula', brands: ['Lactogen', 'NAN Pro', 'Similac'], packs: [['400 g', 0.45], ['1 kg', 1]], p: 700 },
    { n: 'Baby Food Puree Pouch', brands: ['Slurrp Farm', 'Happa', 'Early Foods'], packs: [['100 g', 0.3], ['4 pack', 1]], p: 180 },
    { n: 'Feeding Bottle', brands: ['Philips Avent', 'Chicco', 'Pigeon'], packs: [['125 ml', 0.7], ['260 ml', 1]], p: 320 },
    { n: 'Antiseptic Liquid', brands: ['Dettol', 'Savlon'], packs: [['125 ml', 0.3], ['550 ml', 0.75], ['1 L', 1]], p: 180 },
    { n: 'Antiseptic Bandage', brands: ['Band-Aid', 'Dettol'], packs: [['20 strips', 0.55], ['40 strips', 1]], p: 60 },
    { n: 'Cotton Rolls', brands: ['Johnson’s', 'Local'], packs: [['25 g', 0.35], ['100 g', 1]], p: 40 },
    { n: 'Digital Thermometer', brands: ['Dr. Morepen', 'Omron'], packs: [['1 unit', 1]], p: 200 },
    { n: 'Hand Sanitizer', brands: ['Dettol', 'Lifebuoy', 'Himalaya'], packs: [['50 ml', 0.3], ['200 ml', 0.6], ['500 ml', 1]], p: 90 },
    { n: 'Baby Powder', brands: ['Johnson’s Baby', 'Himalaya'], packs: [['100 g', 0.35], ['400 g', 1]], p: 120 },
    { n: 'Ragi Porridge Mix', brands: ['Slurrp Farm', 'Early Foods'], packs: [['200 g', 1]], p: 200 },
    { n: 'Baby Toothbrush', brands: ['Chicco', 'Pigeon', 'Mee Mee'], packs: [['1 pc', 0.55], ['2 pack', 1]], p: 90 },
    { n: 'Vitamin C Tablets', brands: ['Limcee', 'Limcee Chewable'], packs: [['20 tablets', 0.4], ['60 tablets', 1]], p: 110 },
    { n: 'Baby ORS Electrolyte', brands: ['Electral', 'WHO-ORS'], packs: [['4 sachets', 0.4], ['10 sachets', 1]], p: 70 },
  ],

  // ===== Expansion wave 2 ===================================================
  // Chicken, Meat & Fish — headline category on Blinkit/Zepto. Rohu & katla
  // are the everyday fish in Bihar/Jharkhand; mutton is the premium occasion buy.
  meat: [
    { n: 'Chicken Curry Cut', brands: ['Licious', 'Fresh Farm', 'Local'], packs: [['500 g', 0.55], ['1 kg', 1]], p: 260 },
    { n: 'Chicken Breast Boneless', brands: ['Licious', 'Fresh Farm'], packs: [['450 g', 1], ['1 kg', 2.1]], p: 320 },
    { n: 'Chicken Drumstick', brands: ['Licious', 'Local'], packs: [['500 g', 1]], p: 220 },
    { n: 'Whole Chicken Skinless', brands: ['Fresh Farm', 'Local'], packs: [['1 kg', 1], ['1.5 kg', 1.45]], p: 240 },
    { n: 'Chicken Keema Mince', brands: ['Licious', 'Fresh Farm'], packs: [['450 g', 1]], p: 280 },
    { n: 'Chicken Sausages', brands: ['Godrej Yummiez', 'Venky’s'], packs: [['250 g', 0.6], ['500 g', 1]], p: 240 },
    { n: 'Chicken Salami', brands: ['Godrej Yummiez', 'Venky’s'], packs: [['200 g', 1]], p: 210 },
    { n: 'Mutton Curry Cut', brands: ['Licious', 'Local'], packs: [['500 g', 0.55], ['1 kg', 1]], p: 820 },
    { n: 'Mutton Keema', brands: ['Licious', 'Local'], packs: [['450 g', 1]], p: 760 },
    { n: 'Rohu Fish Cut', brands: ['Local Catch', 'Fresh Catch'], packs: [['500 g', 0.55], ['1 kg', 1]], p: 320 },
    { n: 'Katla Fish Cut', brands: ['Local Catch', 'Fresh Catch'], packs: [['500 g', 0.55], ['1 kg', 1]], p: 300 },
    { n: 'Rui Machh Steaks', brands: ['Fresh Catch'], packs: [['500 g', 1]], p: 340 },
    { n: 'Prawns Cleaned', brands: ['Licious', 'Fresh Catch'], packs: [['250 g', 0.55], ['500 g', 1]], p: 480 },
    { n: 'Basa Fish Fillet', brands: ['Licious', 'Fresh Catch'], packs: [['500 g', 1]], p: 420 },
    { n: 'Pomfret Whole', brands: ['Fresh Catch'], packs: [['500 g', 1]], p: 620 },
    { n: 'Country Eggs Desi', brands: ['Local Farm'], packs: [['6 pcs', 0.5], ['12 pcs', 1]], p: 130 },
    { n: 'Fish Curry Masala Kit', brands: ['Local', 'MDH'], packs: [['100 g', 1]], p: 70 },
  ],

  // Breakfast & Spreads — pulled out of Instant Food into its own shelf, which
  // is how Blinkit ("Breakfast & Instant Food") and Zepto merchandise it.
  breakfast: [
    { n: 'Corn Flakes', brands: ['Kellogg’s', 'Bagrry’s', 'Patanjali'], packs: [['250 g', 0.45], ['475 g', 0.8], ['875 g', 1]], p: 420 },
    { n: 'Chocos Cereal', brands: ['Kellogg’s', 'Bagrry’s'], packs: [['300 g', 0.6], ['700 g', 1]], p: 380 },
    { n: 'Muesli Fruit & Nut', brands: ['Bagrry’s', 'Kellogg’s', 'Soulfull'], packs: [['400 g', 0.55], ['750 g', 1]], p: 520 },
    { n: 'Rolled Oats', brands: ['Quaker', 'Saffola', 'Bagrry’s'], packs: [['400 g', 0.35], ['1 kg', 1]], p: 320 },
    { n: 'Masala Oats Cup', brands: ['Saffola', 'Quaker'], packs: [['40 g cup', 0.25], ['6 pack', 1]], p: 210 },
    { n: 'Ragi Malt Mix', brands: ['Soulfull', 'Manna'], packs: [['500 g', 1]], p: 240 },
    { n: 'Mixed Fruit Jam', brands: ['Kissan', 'Tops', 'Patanjali'], packs: [['200 g', 0.35], ['500 g', 0.75], ['700 g', 1]], p: 240 },
    { n: 'Strawberry Jam', brands: ['Kissan', 'Tops'], packs: [['200 g', 0.4], ['500 g', 1]], p: 200 },
    { n: 'Peanut Butter Creamy', brands: ['Pintola', 'Sundrop', 'MyFitness'], packs: [['340 g', 0.45], ['1 kg', 1]], p: 520 },
    { n: 'Honey', brands: ['Dabur', 'Patanjali', 'Apis'], packs: [['250 g', 0.35], ['500 g', 0.65], ['1 kg', 1]], p: 480 },
    { n: 'Tomato Ketchup Squeezy', brands: ['Kissan', 'Maggi', 'Veeba'], packs: [['200 g', 0.25], ['500 g', 0.55], ['950 g', 1]], p: 180 },
    { n: 'Eggless Mayonnaise', brands: ['Veeba', 'Dr. Oetker FunFoods', 'Cremica'], packs: [['250 g', 0.45], ['875 g', 1]], p: 220 },
    { n: 'Chilli Garlic Sauce', brands: ['Veeba', 'Ching’s', 'Cremica'], packs: [['200 g', 0.5], ['320 g', 1]], p: 110 },
    { n: 'Schezwan Sauce', brands: ['Ching’s', 'Veeba'], packs: [['250 g', 1]], p: 130 },
    { n: 'Chocolate Spread', brands: ['Nutella', 'Hershey’s', 'Cadbury'], packs: [['160 g', 0.35], ['350 g', 1]], p: 320 },
    { n: 'Vermicelli Sewai', brands: ['Bambino', 'MTR'], packs: [['400 g', 0.6], ['900 g', 1]], p: 90 },
    { n: 'Idli Dosa Batter', brands: ['iD Fresh', 'MTR'], packs: [['1 kg', 1]], p: 90 },
    { n: 'Sprouted Moong Chilla Mix', brands: ['MTR', 'Gits'], packs: [['200 g', 1]], p: 85 },
  ],

  // Frozen — Zepto lists ~799 SKUs here; McCain & Godrej Yummiez lead.
  // NOTE: requires a freezer at the dukaan — flagged in vendor onboarding.
  frozen: [
    { n: 'Frozen French Fries', brands: ['McCain', 'ITC Master Chef'], packs: [['420 g', 0.5], ['750 g', 0.85], ['1.25 kg', 1]], p: 320 },
    { n: 'Aloo Tikki Frozen', brands: ['McCain', 'Godrej Yummiez'], packs: [['400 g', 1]], p: 180 },
    { n: 'Smiley Potato Bites', brands: ['McCain', 'Wow! Smiley'], packs: [['415 g', 1]], p: 190 },
    { n: 'Veg Nuggets', brands: ['McCain', 'Godrej Yummiez'], packs: [['400 g', 1]], p: 200 },
    { n: 'Chicken Nuggets Frozen', brands: ['Godrej Yummiez', 'Venky’s', 'Prasuma'], packs: [['400 g', 1]], p: 280 },
    { n: 'Chicken Seekh Kebab Frozen', brands: ['Godrej Yummiez', 'Prasuma'], packs: [['400 g', 1]], p: 300 },
    { n: 'Frozen Green Peas', brands: ['Safal', 'Godrej Yummiez'], packs: [['500 g', 0.55], ['1 kg', 1]], p: 160 },
    { n: 'Frozen Sweet Corn', brands: ['Safal', 'Godrej Yummiez'], packs: [['500 g', 1]], p: 120 },
    { n: 'Frozen Mixed Vegetables', brands: ['Safal', 'Godrej Yummiez'], packs: [['500 g', 1]], p: 140 },
    { n: 'Veg Momos Frozen', brands: ['Wow! Momo', 'Prasuma', 'Sumeru'], packs: [['300 g', 1]], p: 180 },
    { n: 'Chicken Momos Frozen', brands: ['Wow! Momo', 'Prasuma'], packs: [['300 g', 1]], p: 220 },
    { n: 'Whole Wheat Chapati Frozen', brands: ['Modern', 'iD Fresh'], packs: [['30 pcs', 1]], p: 180 },
    { n: 'Frozen Malabar Paratha', brands: ['Sumeru', 'iD Fresh', 'Modern'], packs: [['400 g · 5 pcs', 1]], p: 150 },
    { n: 'Vanilla Ice Cream Tub', brands: ['Amul', 'Kwality Walls', 'Mother Dairy'], packs: [['700 ml', 0.65], ['1.25 L', 1]], p: 280 },
    { n: 'Chocolate Ice Cream Tub', brands: ['Amul', 'Kwality Walls'], packs: [['700 ml', 0.65], ['1.25 L', 1]], p: 300 },
    { n: 'Kulfi Sticks', brands: ['Amul', 'Vadilal'], packs: [['4 pack', 1]], p: 140 },
    { n: 'Cornetto Cone', brands: ['Kwality Walls', 'Amul'], packs: [['single', 0.3], ['4 pack', 1]], p: 200 },
    { n: 'Frozen Paneer Cubes', brands: ['Safal', 'Milky Mist'], packs: [['500 g', 1]], p: 220 },
  ],

  // Dry Fruits & Makhana — high margin, gifting-led. Makhana is grown in
  // Darbhanga/Madhubani, Bihar: a genuine local sourcing edge for us.
  dryfruits: [
    { n: 'Almonds California', brands: ['Happilo', 'Nutraj', 'Vedaka'], packs: [['200 g', 0.28], ['500 g', 0.62], ['1 kg', 1]], p: 900 },
    { n: 'Cashew Whole W240', brands: ['Happilo', 'Nutraj', 'Vedaka'], packs: [['200 g', 0.28], ['500 g', 0.62], ['1 kg', 1]], p: 1000 },
    { n: 'Pistachio Roasted Salted', brands: ['Happilo', 'Nutraj'], packs: [['200 g', 0.3], ['500 g', 1]], p: 700 },
    { n: 'Walnut Kernels', brands: ['Happilo', 'Nutraj'], packs: [['200 g', 0.35], ['500 g', 1]], p: 800 },
    { n: 'Raisins Kishmish', brands: ['Happilo', 'Nutraj', 'Vedaka'], packs: [['250 g', 0.3], ['500 g', 0.55], ['1 kg', 1]], p: 420 },
    { n: 'Phool Makhana Fox Nuts', brands: ['Bihar Special', 'Happilo', 'Local'], packs: [['100 g', 0.3], ['250 g', 0.65], ['500 g', 1]], p: 420 },
    { n: 'Roasted Makhana Peri Peri', brands: ['Bihar Special', 'Too Yumm'], packs: [['75 g', 1]], p: 90 },
    { n: 'Dates Khajur Seedless', brands: ['Lion', 'Happilo', 'Vedaka'], packs: [['250 g', 0.35], ['500 g', 0.62], ['1 kg', 1]], p: 400 },
    { n: 'Anjeer Dried Figs', brands: ['Happilo', 'Nutraj'], packs: [['200 g', 0.4], ['500 g', 1]], p: 750 },
    { n: 'Apricot Dried Khubani', brands: ['Happilo', 'Nutraj'], packs: [['200 g', 0.4], ['500 g', 1]], p: 550 },
    { n: 'Mixed Dry Fruits Gift Box', brands: ['Happilo', 'Nutraj'], packs: [['500 g box', 0.6], ['1 kg box', 1]], p: 1200 },
    { n: 'Chia Seeds', brands: ['True Elements', 'Happilo'], packs: [['200 g', 0.5], ['500 g', 1]], p: 340 },
    { n: 'Flax Seeds Alsi', brands: ['True Elements', 'Nutraj'], packs: [['200 g', 0.5], ['500 g', 1]], p: 220 },
    { n: 'Pumpkin Seeds', brands: ['Happilo', 'True Elements'], packs: [['200 g', 0.5], ['500 g', 1]], p: 380 },
    { n: 'Sunflower Seeds', brands: ['Happilo', 'True Elements'], packs: [['200 g', 0.5], ['500 g', 1]], p: 300 },
    { n: 'Trail Mix Berries & Nuts', brands: ['Happilo', 'Yoga Bar'], packs: [['200 g', 1]], p: 400 },
    { n: 'Gud Jaggery Cubes', brands: ['24 Mantra', 'Local'], packs: [['500 g', 0.55], ['1 kg', 1]], p: 120 },
  ],

  // Pharma & Wellness — OTC ONLY. No prescription medicines (Blinkit, Zepto
  // and Instamart all refuse them; we do too).
  pharma: [
    { n: 'Paracetamol 500mg Tablets', brands: ['Crocin', 'Dolo 650', 'Calpol'], packs: [['10 tablets', 0.4], ['15 tablets', 1]], p: 35 },
    { n: 'Antacid Tablets', brands: ['Digene', 'Eno', 'Gelusil'], packs: [['10 tablets', 0.5], ['30 tablets', 1]], p: 90 },
    { n: 'Antacid Fruit Salt Sachet', brands: ['Eno', 'Gelusil'], packs: [['5 g sachet', 0.15], ['100 g bottle', 1]], p: 130 },
    { n: 'Pain Relief Balm', brands: ['Amrutanjan', 'Zandu', 'Tiger Balm'], packs: [['9 ml', 0.4], ['25 ml', 1]], p: 120 },
    { n: 'Pain Relief Spray', brands: ['Volini', 'Moov'], packs: [['40 g', 0.5], ['100 g', 1]], p: 300 },
    { n: 'Cough Syrup', brands: ['Benadryl', 'Honitus', 'Dabur'], packs: [['100 ml', 0.6], ['200 ml', 1]], p: 190 },
    { n: 'Cough Lozenges', brands: ['Strepsils', 'Vicks', 'Halls'], packs: [['8 pcs', 0.4], ['pack of 20', 1]], p: 90 },
    { n: 'Glucose Energy Powder', brands: ['Glucon-D', 'Dabur'], packs: [['500 g', 1], ['1 kg jar', 1.8]], p: 180 },
    { n: 'Chewable Vitamin C Tablets', brands: ['Limcee', 'Celin'], packs: [['15 tablets', 0.5], ['30 tablets', 1]], p: 60 },
    { n: 'Antiseptic Liquid', brands: ['Dettol', 'Savlon'], packs: [['100 ml', 0.4], ['250 ml', 1]], p: 130 },
    { n: 'Adhesive Bandages', brands: ['Band-Aid', 'Dettol'], packs: [['pack of 10', 0.6], ['pack of 25', 1]], p: 90 },
    { n: 'Pain Relief Balm Jar', brands: ['Zandu', 'Amrutanjan', 'Tiger Balm'], packs: [['25 g', 0.6], ['50 g', 1]], p: 120 },
    { n: 'Vapo Rub', brands: ['Vicks', 'Amrutanjan'], packs: [['25 g', 0.5], ['50 g', 1]], p: 180 },
    { n: 'Digestive Churan Tablets', brands: ['Hajmola', 'Dabur'], packs: [['120 tablets', 1]], p: 80 },
    { n: 'ORS Electrolyte Powder', brands: ['Electral', 'Prolyte'], packs: [['sachet', 0.15], ['10 sachets', 1]], p: 220 },
    { n: 'Multivitamin Tablets', brands: ['Revital H', 'Supradyn', 'Zincovit'], packs: [['15 tablets', 0.4], ['30 tablets', 1]], p: 340 },
    { n: 'Vitamin D3 Sachet', brands: ['Uprise D3', 'Calcirol'], packs: [['4 sachets', 1]], p: 180 },
    { n: 'Calcium Tablets', brands: ['Shelcal', 'Ostocalcium'], packs: [['15 tablets', 0.5], ['30 tablets', 1]], p: 220 },
    { n: 'Protein Powder', brands: ['Horlicks Protein+', 'Ensure', 'Optimum Nutrition'], packs: [['200 g', 0.25], ['400 g', 0.45], ['1 kg', 1]], p: 1400 },
    { n: 'Chyawanprash', brands: ['Dabur', 'Patanjali', 'Baidyanath'], packs: [['500 g', 0.55], ['1 kg', 1]], p: 450 },
    { n: 'Giloy Tulsi Immunity Drops', brands: ['Dabur', 'Patanjali'], packs: [['30 ml', 1]], p: 160 },
    { n: 'Digital BP Monitor', brands: ['Omron', 'Dr. Morepen'], packs: [['1 unit', 1]], p: 1800 },
    { n: 'Glucometer Strips', brands: ['Accu-Chek', 'Dr. Morepen'], packs: [['25 strips', 0.55], ['50 strips', 1]], p: 900 },
    { n: 'Surgical Face Mask', brands: ['Dettol', 'Local'], packs: [['10 pcs', 0.4], ['50 pcs box', 1]], p: 200 },
    { n: 'Crepe Bandage', brands: ['Dynamic', 'Local'], packs: [['6 cm', 0.7], ['10 cm', 1]], p: 130 },
    { n: 'Antiseptic Cream', brands: ['Boroline', 'Betadine', 'Soframycin'], packs: [['20 g', 0.5], ['40 g', 1]], p: 90 },
  ],

  // Pooja & Festive — culturally essential in India, largely missing from
  // Western-modelled apps. Chhath Puja is THE Bihar festival: our home market.
  pooja: [
    { n: 'Agarbatti Incense Sticks', brands: ['Cycle', 'Mangaldeep', 'Zed Black'], packs: [['50 sticks', 0.35], ['100 sticks', 0.6], ['200 sticks', 1]], p: 150 },
    { n: 'Dhoop Sticks', brands: ['Cycle', 'Mangaldeep'], packs: [['12 sticks', 0.5], ['20 sticks', 1]], p: 90 },
    { n: 'Sambrani Cups', brands: ['Cycle', 'Mangaldeep'], packs: [['12 cups', 1]], p: 80 },
    { n: 'Camphor Kapur Tablets', brands: ['Mangalam', 'Cycle'], packs: [['50 g', 0.5], ['100 g', 1]], p: 120 },
    { n: 'Brass Diya Lamp', brands: ['Local'], packs: [['1 pc small', 0.5], ['1 pc medium', 1]], p: 180 },
    { n: 'Clay Diya Set', brands: ['Local'], packs: [['12 pcs', 0.5], ['24 pcs', 1]], p: 100 },
    { n: 'Cotton Wicks Batti', brands: ['Local', 'Mangalam'], packs: [['100 pcs', 0.5], ['250 pcs', 1]], p: 60 },
    { n: 'Pooja Oil Til Oil', brands: ['Idhayam', 'Local'], packs: [['200 ml', 0.4], ['500 ml', 1]], p: 180 },
    { n: 'Ghee Diya Batti Ready', brands: ['Mangaldeep', 'Local'], packs: [['6 pcs', 1]], p: 90 },
    { n: 'Kumkum Roli Powder', brands: ['Local'], packs: [['50 g', 1]], p: 40 },
    { n: 'Haldi Chandan Tika', brands: ['Local'], packs: [['50 g', 1]], p: 45 },
    { n: 'Ganga Jal Bottle', brands: ['Local'], packs: [['250 ml', 1]], p: 50 },
    { n: 'Mauli Kalava Sacred Thread', brands: ['Local'], packs: [['1 roll', 1]], p: 25 },
    { n: 'Janeu Sacred Thread', brands: ['Local'], packs: [['3 pcs', 1]], p: 40 },
    { n: 'Marigold Garland Fresh', brands: ['Local'], packs: [['1 garland', 0.6], ['2 garlands', 1]], p: 90 },
    { n: 'Rose Flower Petals', brands: ['Local'], packs: [['100 g', 1]], p: 60 },
    { n: 'Nariyal Coconut for Pooja', brands: ['Local'], packs: [['1 pc', 0.55], ['2 pcs', 1]], p: 70 },
    { n: 'Panchamrit Pooja Kit', brands: ['Local'], packs: [['1 kit', 1]], p: 150 },
    { n: 'Chhath Puja Soop Daura Set', brands: ['Local'], packs: [['1 set', 1]], p: 350 },
    { n: 'Chhath Puja Complete Kit', brands: ['Local'], packs: [['1 kit', 1]], p: 650 },
    { n: 'Diwali Pooja Thali Set', brands: ['Local'], packs: [['1 set', 1]], p: 450 },
    { n: 'Rangoli Colour Powder', brands: ['Local'], packs: [['5 colours', 1]], p: 90 },
    { n: 'Havan Samagri', brands: ['Patanjali', 'Local'], packs: [['200 g', 0.55], ['500 g', 1]], p: 160 },
    { n: 'Matchbox Bundle', brands: ['Homelite', 'Ship'], packs: [['10 boxes', 1]], p: 40 },
  ],

  // Home & Kitchen Needs — Blinkit's "Home & Office". The village-kirana moat:
  // matchbox, candle, bulb, battery. Emergency buys with a healthy margin.
  homekitchen: [
    { n: 'LED Bulb 9W', brands: ['Philips', 'Syska', 'Wipro'], packs: [['1 pc', 0.55], ['2 pack', 1]], p: 300 },
    { n: 'LED Bulb 12W', brands: ['Philips', 'Syska', 'Havells'], packs: [['1 pc', 1]], p: 220 },
    { n: 'LED Tube Light 20W', brands: ['Philips', 'Wipro'], packs: [['1 pc', 1]], p: 420 },
    { n: 'AA Batteries', brands: ['Duracell', 'Eveready', 'Panasonic'], packs: [['2 pcs', 0.45], ['4 pcs', 0.8], ['10 pcs', 1]], p: 340 },
    { n: 'AAA Batteries', brands: ['Duracell', 'Eveready'], packs: [['2 pcs', 0.5], ['4 pcs', 1]], p: 190 },
    { n: 'Candles White', brands: ['Local'], packs: [['6 pcs', 0.55], ['12 pcs', 1]], p: 90 },
    { n: 'Gas Lighter', brands: ['Pigeon', 'Local'], packs: [['1 pc', 1]], p: 130 },
    { n: 'Steel Water Bottle', brands: ['Milton', 'Cello'], packs: [['750 ml', 0.7], ['1 L', 1]], p: 450 },
    { n: 'Plastic Bucket', brands: ['Cello', 'Nayasa'], packs: [['15 L', 0.7], ['20 L', 1]], p: 320 },
    { n: 'Plastic Mug', brands: ['Cello', 'Nayasa'], packs: [['1 pc', 1]], p: 70 },
    { n: 'Dustbin with Lid', brands: ['Cello', 'Nayasa'], packs: [['10 L', 0.7], ['20 L', 1]], p: 400 },
    { n: 'Steel Tiffin Box', brands: ['Milton', 'Cello'], packs: [['2 container', 0.7], ['3 container', 1]], p: 550 },
    { n: 'Non-Stick Tawa', brands: ['Prestige', 'Hawkins', 'Pigeon'], packs: [['25 cm', 1]], p: 700 },
    { n: 'Pressure Cooker', brands: ['Prestige', 'Hawkins'], packs: [['3 L', 0.75], ['5 L', 1]], p: 2200 },
    { n: 'Kitchen Knife', brands: ['Pigeon', 'Local'], packs: [['1 pc', 1]], p: 150 },
    { n: 'Vegetable Chopper', brands: ['Pigeon', 'Ganesh'], packs: [['1 pc', 1]], p: 400 },
    { n: 'Steel Scrubber', brands: ['Scotch-Brite', 'Local'], packs: [['3 pcs', 1]], p: 60 },
    { n: 'Clothes Hanger Set', brands: ['Local'], packs: [['6 pcs', 1]], p: 150 },
    { n: 'Nylon Clothesline Rope', brands: ['Local'], packs: [['10 m', 1]], p: 90 },
    { n: 'Umbrella', brands: ['John’s', 'Local'], packs: [['1 pc', 1]], p: 350 },
    { n: 'Extension Cord Board', brands: ['Anchor', 'Havells'], packs: [['4 socket', 1]], p: 450 },
    { n: 'Insulation Tape', brands: ['Anchor', 'Local'], packs: [['1 pc', 1]], p: 30 },
  ],

  // Stationery & Office — Blinkit lists it; huge school-season demand and a
  // strong Tier-2/3 fit where a dedicated stationer may be far away.
  stationery: [
    { n: 'Ball Pen Blue', brands: ['Cello', 'Reynolds', 'Linc'], packs: [['5 pcs', 0.5], ['10 pcs', 1]], p: 100 },
    { n: 'Gel Pen Black', brands: ['Cello', 'Reynolds', 'Linc'], packs: [['5 pcs', 1]], p: 100 },
    { n: 'Pencil HB', brands: ['Apsara', 'Nataraj', 'Doms'], packs: [['10 pcs', 1]], p: 60 },
    { n: 'Eraser & Sharpener Set', brands: ['Apsara', 'Doms'], packs: [['1 set', 1]], p: 40 },
    { n: 'Long Notebook 172 Pages', brands: ['Classmate', 'Navneet', 'Local'], packs: [['1 pc', 0.3], ['6 pack', 1]], p: 350 },
    { n: 'Spiral Notebook A4', brands: ['Classmate', 'Navneet'], packs: [['1 pc', 1]], p: 120 },
    { n: 'Practical Copy', brands: ['Classmate', 'Local'], packs: [['1 pc', 1]], p: 80 },
    { n: 'Geometry Box', brands: ['Camlin', 'Doms', 'Classmate'], packs: [['1 set', 1]], p: 220 },
    { n: 'Wax Crayons', brands: ['Doms', 'Camlin'], packs: [['12 shades', 0.6], ['24 shades', 1]], p: 130 },
    { n: 'Colour Pencils', brands: ['Doms', 'Camlin', 'Apsara'], packs: [['12 shades', 1]], p: 110 },
    { n: 'Sketch Pens', brands: ['Doms', 'Camlin'], packs: [['12 shades', 1]], p: 120 },
    { n: 'Chart Paper', brands: ['Local'], packs: [['5 sheets', 1]], p: 50 },
    { n: 'A4 Copier Paper', brands: ['JK', 'Century'], packs: [['100 sheets', 0.25], ['500 sheets ream', 1]], p: 380 },
    { n: 'Glue Stick', brands: ['Fevistick', 'Camlin'], packs: [['15 g', 0.5], ['25 g', 1]], p: 70 },
    { n: 'Adhesive Fevicol', brands: ['Fevicol'], packs: [['50 g', 0.5], ['200 g', 1]], p: 110 },
    { n: 'Cello Tape', brands: ['Wonder', 'Local'], packs: [['1 roll', 1]], p: 40 },
    { n: 'Stapler with Pins', brands: ['Kangaro', 'Local'], packs: [['1 set', 1]], p: 130 },
    { n: 'Scissors', brands: ['Camlin', 'Local'], packs: [['1 pc', 1]], p: 90 },
    { n: 'File Folder', brands: ['Solo', 'Local'], packs: [['5 pcs', 1]], p: 150 },
    { n: 'Whiteboard Marker', brands: ['Camlin', 'Luxor'], packs: [['4 pcs', 1]], p: 130 },
    { n: 'Highlighter Set', brands: ['Camlin', 'Luxor'], packs: [['4 shades', 1]], p: 140 },
    { n: 'Envelope Pack', brands: ['Local'], packs: [['20 pcs', 1]], p: 60 },
  ],

  // Beauty & Cosmetics — Blinkit and Zepto are both actively expanding here.
  beauty: [
    { n: 'Matte Lipstick', brands: ['Lakme', 'Maybelline', 'Sugar'], packs: [['1 pc', 1]], p: 550 },
    { n: 'Lip Balm', brands: ['Nivea', 'Vaseline', 'Himalaya'], packs: [['4.8 g', 1]], p: 160 },
    { n: 'Kajal Pencil', brands: ['Lakme', 'Maybelline', 'Himalaya'], packs: [['1 pc', 1]], p: 250 },
    { n: 'Compact Powder', brands: ['Lakme', 'Maybelline', 'Ponds'], packs: [['9 g', 1]], p: 330 },
    { n: 'Foundation', brands: ['Lakme', 'Maybelline'], packs: [['30 ml', 1]], p: 600 },
    { n: 'Nail Polish', brands: ['Lakme', 'Elle 18', 'Colorbar'], packs: [['1 pc', 1]], p: 130 },
    { n: 'Nail Polish Remover', brands: ['Lakme', 'Colorbar'], packs: [['27 ml', 0.5], ['50 ml', 1]], p: 110 },
    { n: 'Mascara', brands: ['Maybelline', 'Lakme'], packs: [['1 pc', 1]], p: 450 },
    { n: 'Eyeliner', brands: ['Maybelline', 'Lakme', 'Sugar'], packs: [['1 pc', 1]], p: 320 },
    { n: 'Bindi Pack', brands: ['Shilpa', 'Local'], packs: [['1 pack', 1]], p: 30 },
    { n: 'Sindoor', brands: ['Shringar', 'Local'], packs: [['1 pc', 1]], p: 60 },
    { n: 'Mehendi Cone', brands: ['Rajasthani', 'Local'], packs: [['3 pcs', 1]], p: 60 },
    { n: 'Hair Colour', brands: ['Godrej Expert', 'Garnier', 'L’Oreal'], packs: [['single sachet', 0.2], ['full pack', 1]], p: 260 },
    { n: 'Hair Serum', brands: ['Livon', 'Streax'], packs: [['50 ml', 0.5], ['100 ml', 1]], p: 340 },
    { n: 'Hair Removal Cream', brands: ['Veet', 'Anne French'], packs: [['25 g', 0.4], ['60 g', 1]], p: 200 },
    { n: 'Face Sheet Mask', brands: ['Garnier', 'Mamaearth'], packs: [['1 pc', 0.3], ['3 pack', 1]], p: 200 },
    { n: 'Face Serum', brands: ['Minimalist', 'Mamaearth', 'Plum'], packs: [['30 ml', 1]], p: 600 },
    { n: 'Makeup Remover Wipes', brands: ['Garnier', 'Lakme'], packs: [['25 wipes', 1]], p: 220 },
    { n: 'Perfume Body Mist', brands: ['Engage', 'Fogg', 'Plum'], packs: [['120 ml', 1]], p: 320 },
    { n: 'Makeup Brush Set', brands: ['Sugar', 'Local'], packs: [['5 pcs', 1]], p: 450 },
  ],

  // Pet Care — growing fast; Blinkit runs a dedicated HUFT tie-up. Thin in
  // Tier-3 today, so we keep the assortment deliberately small.
  pet: [
    { n: 'Adult Dog Dry Food', brands: ['Pedigree', 'Drools', 'Royal Canin'], packs: [['1.2 kg', 0.35], ['3 kg', 0.75], ['10 kg', 1]], p: 3200 },
    { n: 'Puppy Dry Food', brands: ['Pedigree', 'Drools'], packs: [['1.2 kg', 0.4], ['3 kg', 1]], p: 1100 },
    { n: 'Dog Wet Food Pouch', brands: ['Pedigree', 'Drools'], packs: [['70 g', 0.2], ['15 pack', 1]], p: 600 },
    { n: 'Dog Biscuits Treats', brands: ['Pedigree', 'Choostix', 'Drools'], packs: [['500 g', 0.55], ['1 kg', 1]], p: 380 },
    { n: 'Dog Chew Bone', brands: ['Choostix', 'Drools'], packs: [['pack of 5', 1]], p: 220 },
    { n: 'Adult Cat Dry Food', brands: ['Whiskas', 'Me-O', 'Drools'], packs: [['1.2 kg', 0.4], ['3 kg', 1]], p: 1300 },
    { n: 'Cat Wet Food Pouch', brands: ['Whiskas', 'Me-O'], packs: [['85 g', 0.2], ['12 pack', 1]], p: 550 },
    { n: 'Cat Litter', brands: ['Drools', 'Me-O'], packs: [['5 kg', 1]], p: 600 },
    { n: 'Pet Shampoo', brands: ['Himalaya', 'Drools'], packs: [['200 ml', 0.55], ['500 ml', 1]], p: 400 },
    { n: 'Pet Grooming Brush', brands: ['Local', 'Drools'], packs: [['1 pc', 1]], p: 300 },
    { n: 'Dog Collar & Leash', brands: ['Local'], packs: [['1 set', 1]], p: 450 },
    { n: 'Pet Feeding Bowl', brands: ['Local', 'Drools'], packs: [['1 pc', 1]], p: 250 },
    { n: 'Bird Feed Seeds', brands: ['Local'], packs: [['500 g', 0.55], ['1 kg', 1]], p: 150 },
  ],

  // Electronics & Accessories — Blinkit positions itself as a "last-minute
  // electronics store": dead charger, forgotten cable. Accessories only.
  electronics: [
    { n: 'USB-C Charging Cable', brands: ['boAt', 'Mi', 'Portronics'], packs: [['1 m', 0.7], ['1.5 m', 1]], p: 400 },
    { n: 'Micro USB Cable', brands: ['boAt', 'Mi'], packs: [['1 m', 1]], p: 250 },
    { n: 'Lightning Cable', brands: ['boAt', 'Portronics'], packs: [['1 m', 1]], p: 600 },
    { n: 'Fast Charger Adapter 20W', brands: ['Mi', 'boAt', 'Portronics'], packs: [['1 pc', 1]], p: 700 },
    { n: 'Power Bank 10000mAh', brands: ['Mi', 'boAt', 'Ambrane'], packs: [['1 pc', 1]], p: 1500 },
    { n: 'Wired Earphones', brands: ['boAt', 'JBL', 'Realme'], packs: [['1 pc', 1]], p: 600 },
    { n: 'Bluetooth Neckband', brands: ['boAt', 'Realme', 'Noise'], packs: [['1 pc', 1]], p: 1200 },
    { n: 'TWS Earbuds', brands: ['boAt', 'Noise', 'Realme'], packs: [['1 pc', 1]], p: 1800 },
    { n: 'Bluetooth Speaker', brands: ['boAt', 'JBL'], packs: [['1 pc', 1]], p: 1800 },
    { n: 'Mobile Back Cover', brands: ['Local'], packs: [['1 pc', 1]], p: 250 },
    { n: 'Tempered Glass Screen Guard', brands: ['Local', 'boAt'], packs: [['1 pc', 0.6], ['2 pack', 1]], p: 250 },
    { n: 'OTG Adapter', brands: ['Portronics', 'Local'], packs: [['1 pc', 1]], p: 200 },
    { n: 'Memory Card 64GB', brands: ['SanDisk', 'Samsung'], packs: [['1 pc', 1]], p: 700 },
    { n: 'Pen Drive 32GB', brands: ['SanDisk', 'HP'], packs: [['1 pc', 1]], p: 450 },
    { n: 'Mobile Stand Holder', brands: ['Portronics', 'Local'], packs: [['1 pc', 1]], p: 250 },
    { n: 'Wall Clock', brands: ['Ajanta', 'Local'], packs: [['1 pc', 1]], p: 450 },
    { n: 'Rechargeable Torch', brands: ['Eveready', 'Syska'], packs: [['1 pc', 1]], p: 400 },
    { n: 'Emergency LED Light', brands: ['Syska', 'Eveready'], packs: [['1 pc', 1]], p: 700 },
  ],

  // Paan Corner — Blinkit's #1 rail. We ship the MOUTH-FRESHENER half only:
  // NO tobacco, NO gutkha, NO age-restricted products. Deliberate call for a
  // village-facing brand.
  paan: [
    { n: 'Meetha Saunf Mukhwas', brands: ['Local', 'Rajnigandha'], packs: [['100 g', 0.5], ['250 g', 1]], p: 130 },
    { n: 'Roasted Saunf', brands: ['Local'], packs: [['100 g', 0.5], ['250 g', 1]], p: 110 },
    { n: 'Mukhwas Mix', brands: ['Local', 'Vimal'], packs: [['100 g', 0.5], ['250 g', 1]], p: 140 },
    { n: 'Paan Masala Mouth Freshener', brands: ['Rajnigandha', 'Pass Pass'], packs: [['10 sachets', 0.5], ['30 sachets', 1]], p: 250 },
    { n: 'Silver Coated Elaichi', brands: ['Local'], packs: [['50 g', 1]], p: 180 },
    { n: 'Green Cardamom Elaichi', brands: ['Local', 'Everest'], packs: [['25 g', 0.5], ['50 g', 1]], p: 220 },
    { n: 'Chocolate Mint Pellets', brands: ['Pass Pass', 'Center Fresh'], packs: [['jar', 1]], p: 150 },
    { n: 'Mint Candy Roll', brands: ['Polo', 'Mentos', 'Alpenliebe'], packs: [['pack of 10', 1]], p: 100 },
    { n: 'Digestive Anardana Goli', brands: ['Hajmola', 'Local'], packs: [['100 g', 1]], p: 70 },
    { n: 'Imli Candy', brands: ['Local'], packs: [['100 g', 1]], p: 60 },
    { n: 'Sweet Betel Paan Ready', brands: ['Local'], packs: [['2 pcs', 0.6], ['5 pcs', 1]], p: 150 },
    { n: 'Gulkand', brands: ['Local', 'Baidyanath'], packs: [['200 g', 0.55], ['400 g', 1]], p: 220 },
    { n: 'Dry Dates Chhuhara', brands: ['Local'], packs: [['200 g', 0.55], ['500 g', 1]], p: 260 },
  ],
};

// ---- Self-hosted category imagery -----------------------------------------
// Production-correct approach: images are OURS, served from /public (and later
// a CDN / object store via the existing /api/upload flow). No hotlinking to
// Unsplash or Wikimedia — those are unverifiable at build time, can 404 or be
// rate-limited, and brand pack shots carry trademark risk.
//
// Only categories with a real photo on disk are listed here; every other SKU
// falls back to the branded gradient + icon plate, which never looks broken.
const CATEGORY_IMAGES = {
  dairy: '/catalog/dairy.jpg',
  vegetables: '/catalog/vegetables.jpg',
  fruits: '/catalog/fruits.jpg',
  staples: '/catalog/staples.jpg',
  oils: '/catalog/oils.jpg',
  munchies: '/catalog/munchies.jpg',
  biscuits: '/catalog/biscuits.jpg',
  chocolates: '/catalog/chocolates.jpg',
  drinks: '/catalog/drinks.jpg',
  tea: '/catalog/tea.jpg',
  instant: '/catalog/instant.jpg',
  household: '/catalog/household.jpg',
  personal: '/catalog/personal.jpg',
  baby: '/catalog/baby.jpg',
  meat: '/catalog/meat.jpg',
  frozen: '/catalog/frozen.jpg',
  dryfruits: '/catalog/dryfruits.jpg',
  pharma: '/catalog/pharma.jpg',
  pooja: '/catalog/pooja.jpg',
  beauty: '/catalog/beauty.jpg',
  // breakfast / homekitchen / stationery / pet / electronics → icon fallback
  // until their photos are generated. CatalogTile degrades gracefully.
};

// ---- Quick-add essentials --------------------------------------------------
// The high-velocity kirana lines a shopkeeper stocks on day one. Matching is by
// case-insensitive substring against the generated product name, restricted to
// the listed category, and only the FIRST pack of each line is flagged so the
// quick-add grid stays one-tap-per-item rather than one-tap-per-pack-size.
const ESSENTIAL_LINES = {
  dairy: ['Fresh Toned Milk', 'Full Cream Milk', 'Fresh Curd', 'Butter', 'Malai Paneer',
    'White Sandwich Bread', 'Brown Bread', 'Fresh Farm Eggs', 'Processed Cheese Slices'],
  vegetables: ['Desi Tomato', 'Hybrid Potato', 'Red Onion', 'Fresh Coriander', 'Ginger Root',
    'Garlic Bulb', 'Green Chilli', 'Palak', 'Cauliflower', 'Capsicum Green', 'Carrot'],
  fruits: ['Robusta Banana', 'Shimla Apple', 'Mosambi', 'Pomegranate', 'Seedless Green Grapes',
    'Papaya', 'Orange'],
  staples: ['Whole Wheat Chakki Atta', 'Basmati Rice', 'Sona Masoori Rice', 'Toor / Arhar Dal',
    'Moong Dhuli Dal', 'Chana Dal', 'Masoor Dal', 'Rajma Chitra', 'Besan Gram Flour',
    'Sooji / Rava', 'Maida', 'Poha', 'Sugar / Cheeni', 'Iodised Salt'],
  oils: ['Refined Sunflower Oil', 'Kachi Ghani Mustard Oil', 'Refined Soyabean Oil', 'Cow Ghee',
    'Deggi Mirch Chilli Powder', 'Haldi / Turmeric Powder', 'Dhania / Coriander Powder',
    'Jeera / Cumin Seeds', 'Garam Masala'],
  munchies: ['Magic Masala Chips', 'Classic Salted Chips', 'Masala Munch Namkeen', 'Aloo Bhujia',
    'Navratan Mixture', 'Roasted Peanuts', 'Salted Popcorn'],
  biscuits: ['Gold Glucose Biscuits', 'Marie Gold Biscuits', 'Cashew Cookies',
    'Chocolate Cream Biscuit', 'Suji Rusk', 'Monaco Salted Biscuits', '50-50 Sweet Salty'],
  chocolates: ['Silk Chocolate Bar', 'Crispy Wafer Chocolate', 'Milk Chocolate Bar', 'Toffee Jar',
    'Ice Cream Tub'],
  drinks: ['Cola Soft Drink', 'Lime Soft Drink', 'Mango Drink', 'Fruit Juice', 'Packaged Water',
    'Energy Drink'],
  tea: ['Premium Leaf Tea', 'Strong CTC Tea', 'Green Tea', 'Instant Coffee Classic',
    'Chocolate Health Drink', 'Masala Chai Tea'],
  instant: ['2-Minute Masala Noodles', 'Cup Noodles', 'Tomato Ketchup', 'Instant Soup',
    'Ready-to-Eat Curry', 'Soy Sauce', 'Instant Upma Mix'],
  household: ['Matic Detergent Powder', 'Top-Load Detergent', 'Dishwash Gel', 'Dishwash Bar',
    'Toilet Cleaner', 'Floor Cleaner', 'Mosquito Coil', 'Garbage Bags', 'Toilet Paper Roll',
    'Broom / Phool Jhadu'],
  personal: ['Germ Protection Soap', 'Beauty Bathing Bar', 'Anti-Dandruff Shampoo', 'Shampoo',
    'Strong Teeth Toothpaste', 'Toothbrush', 'Hair Oil', 'Face Wash', 'Deodorant Spray',
    'Hand Wash', 'Sanitary Pads', 'Shaving Cream'],
  baby: ['Diapers Pants', 'Baby Wipes', 'Baby Soap', 'Infant Cereal', 'Antiseptic Liquid',
    'Hand Sanitizer'],
  // ---- Expansion wave 2 ----
  meat: ['Chicken Curry Cut', 'Chicken Breast Boneless', 'Rohu Fish Cut', 'Katla Fish Cut',
    'Mutton Curry Cut', 'Country Eggs Desi'],
  breakfast: ['Corn Flakes', 'Rolled Oats', 'Mixed Fruit Jam', 'Peanut Butter Creamy', 'Honey',
    'Tomato Ketchup Squeezy', 'Eggless Mayonnaise', 'Idli Dosa Batter'],
  frozen: ['Frozen French Fries', 'Frozen Green Peas', 'Veg Momos Frozen',
    'Whole Wheat Chapati Frozen', 'Vanilla Ice Cream Tub'],
  dryfruits: ['Almonds California', 'Cashew Whole W240', 'Raisins Kishmish',
    'Phool Makhana Fox Nuts', 'Dates Khajur Seedless', 'Gud Jaggery Cubes'],
  pharma: ['Paracetamol 500mg Tablets', 'Antacid Fruit Salt Sachet', 'Pain Relief Balm',
    'Cough Syrup', 'ORS Electrolyte Powder', 'Multivitamin Tablets', 'Vapo Rub',
    'Antiseptic Cream'],
  pooja: ['Agarbatti Incense Sticks', 'Camphor Kapur Tablets', 'Clay Diya Set',
    'Cotton Wicks Batti', 'Kumkum Roli Powder', 'Matchbox Bundle', 'Nariyal Coconut for Pooja'],
  homekitchen: ['LED Bulb 9W', 'AA Batteries', 'Candles White', 'Gas Lighter', 'Plastic Bucket',
    'Steel Scrubber', 'Kitchen Knife'],
  stationery: ['Ball Pen Blue', 'Pencil HB', 'Long Notebook 172 Pages', 'Eraser & Sharpener Set',
    'A4 Copier Paper', 'Glue Stick', 'Geometry Box'],
  beauty: ['Matte Lipstick', 'Kajal Pencil', 'Lip Balm', 'Nail Polish', 'Bindi Pack', 'Sindoor',
    'Hair Colour'],
  pet: ['Adult Dog Dry Food', 'Dog Biscuits Treats', 'Adult Cat Dry Food', 'Pet Shampoo'],
  electronics: ['USB-C Charging Cable', 'Fast Charger Adapter 20W', 'Wired Earphones',
    'Power Bank 10000mAh', 'Tempered Glass Screen Guard', 'Rechargeable Torch'],
  paan: ['Meetha Saunf Mukhwas', 'Paan Masala Mouth Freshener', 'Mint Candy Roll',
    'Green Cardamom Elaichi', 'Digestive Anardana Goli'],
};

// ---- Deterministic pseudo-random (mulberry32) ------------------------------
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Drop an immediately-repeated word so brand+line concatenation reads naturally:
 *   "Amul Butter Butter"        → "Amul Butter"
 *   "Coca-Cola Cola Soft Drink" → "Coca-Cola Soft Drink"  (hyphen tail matches)
 */
function dedupeWords(s) {
  const out = [];
  for (const w of s.split(' ')) {
    const prev = out.length ? out[out.length - 1].toLowerCase() : '';
    const cur = w.toLowerCase();
    // exact repeat, or the previous token's hyphen tail repeats ("coca-cola" + "cola")
    if (prev === cur || prev.split('-').pop() === cur) continue;
    out.push(w);
  }
  return out.join(' ');
}

function normPack(pk) {
  if (Array.isArray(pk)) {
    return { unit: String(pk[0]), mult: typeof pk[1] === 'number' ? pk[1] : 1 };
  }
  return { unit: String(pk), mult: 1 };
}

const products = [];
let skuCounter = 0;
const seen = new Set();

CATEGORIES.forEach((cat, catIdx) => {
  const items = CATALOG[cat.id] || [];
  const rand = mulberry32(1000 + catIdx * 97);

  items.forEach((item) => {
    const brands = item.brands && item.brands.length ? item.brands : [null];
    brands.forEach((brand) => {
      item.packs.forEach((pk) => {
        const { unit, mult } = normPack(pk);
        // Collapse "Amul Butter Butter" → "Amul Butter" when the brand label
        // already ends with the product-line word.
        const name = brand ? dedupeWords(`${brand} ${item.n}`) : item.n;
        const key = `${cat.id}::${name}::${unit}`;
        if (seen.has(key)) return;
        seen.add(key);

        const price = Math.max(5, Math.round(item.p * mult));
        // deterministic markup 8%–35%; whole rupees; guarantee mrp > price
        const markup = 1.08 + rand() * 0.27;
        const mrp = Math.max(price + 1, Math.round(price * markup));

        const sku = {
          id: `bb-${catIdx + 1}-${(skuCounter + 1).toString().padStart(4, '0')}`,
          name,
          category: cat.label,
          categoryId: cat.id,
          unit,
          price,
          mrp,
          icon: cat.icon,
          from: cat.from,
          to: cat.to,
        };
        products.push(sku);
        skuCounter++;
      });
    });
  });
});

// Sort within each category alphabetically for stable shelf ordering.
const catOrder = new Map(CATEGORIES.map((c, i) => [c.label, i]));
products.sort((a, b) => catOrder.get(a.category) - catOrder.get(b.category) || a.name.localeCompare(b.name));
// Re-issue clean sequential ids after sort.
products.forEach((p, i) => {
  p.id = `bb-${(i + 1).toString().padStart(5, '0')}`;
});

// ---- Flag the quick-add essentials ----------------------------------------
// One SKU per essential line (the first/smallest pack after the alpha sort),
// so the vendor quick-add grid is one tap per *item*, not per pack size.
const essentialIds = [];
for (const cat of CATEGORIES) {
  const lines = ESSENTIAL_LINES[cat.id] || [];
  const pool = products.filter((p) => p.categoryId === cat.id);
  const taken = new Set();
  for (const line of lines) {
    const needle = line.toLowerCase();
    const hit = pool.find((p) => !taken.has(p.id) && p.name.toLowerCase().includes(needle));
    if (hit) {
      taken.add(hit.id);
      essentialIds.push(hit.id);
    }
  }
}
const essentialCount = { n: essentialIds.length };

const byCat = {};
for (const c of CATEGORIES) byCat[c.label] = products.filter((p) => p.category === c.label).length;

// ---- Per-SKU studio pack shots (Central Product Asset Repository) ----------
// Read from public/catalog/catalog-assets.json, which is itself generated and
// verified by scripts/gen-catalog-assets.cjs (600x600, exists on disk, SKU id
// present in this catalog). A SKU with its own pack shot beats the category
// photo; a SKU without one keeps the category photo, then the icon plate.
const SKU_IMAGES = {};
{
  const manifestPath = path.join(__dirname, '..', 'public', 'catalog', 'catalog-assets.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const known = new Set(products.map((p) => p.id));
    for (const [skuId, entry] of Object.entries(manifest.items || {})) {
      if (known.has(skuId)) SKU_IMAGES[skuId] = entry.path;
    }
  }
}

// ---- Emit TypeScript module -----------------------------------------------
const header = `/* eslint-disable */
// AUTO-GENERATED by scripts/gen-bighi-catalog.cjs — do not edit by hand.
// Regenerate with:  node scripts/gen-bighi-catalog.cjs
//
// Bighi Brothers Mart flagship master catalog — ${products.length} SKUs across
// ${CATEGORIES.length} quick-commerce categories. Brand names are used purely
// as descriptive product labels for the demo storefront.

export interface BighiCategory {
  id: string;
  label: string;
  icon: string;
  from: string;
  to: string;
  /** Self-hosted category photo under /public. Absent → icon plate fallback. */
  image?: string;
}

export interface BighiProduct {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  unit: string;
  price: number;
  mrp: number;
  icon: string;
  from: string;
  to: string;
  /** Self-hosted photo under /public. Absent → branded icon plate fallback. */
  image?: string;
  /** High-velocity kirana line, surfaced in the vendor quick-add grid. */
  essential?: boolean;
}

export interface PromoCarousel {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  from: string;
  to: string;
  tag: string;
}

export const BIGHI_STORE = {
  id: 'bighi-brothers-mart',
  name: 'Bighi Brothers Mart',
  subtitle: 'Fresh. Daily. Delivered.',
  tagline: 'Your 10-minute hyperlocal superstore',
  rating: 4.9,
  reviewsLabel: '4.9 rating · 12.4k+ reviews',
  etaMinutes: 10,
  verifiedLabel: 'Verified Superstore',
  heroBanner: '/banners/bighi_hero_banner.jpg',
  address: 'Ashok Nagar Road No. 4, Ranchi · 834002',
};

export const BIGHI_PROMOS: PromoCarousel[] = [
  {
    id: 'super-saver',
    title: 'Super Saver Deals',
    subtitle: 'Up to 50% OFF on daily essentials — atta, dal, oil & more',
    icon: 'local_fire_department',
    from: '#F59E0B',
    to: '#B45309',
    tag: 'Up to 50% OFF',
  },
  {
    id: 'farm-fresh',
    title: 'Farm Fresh Harvest',
    subtitle: 'Tomatoes, potatoes & coriander, straight from the local mandi',
    icon: 'agriculture',
    from: '#22C55E',
    to: '#15803D',
    tag: 'Harvested today',
  },
  {
    id: 'midnight',
    title: 'Midnight Sips & Munchies',
    subtitle: 'Chilled beverages, chips & chocolates for late-night cravings',
    icon: 'nightlife',
    from: '#6366F1',
    to: '#3730A3',
    tag: '10-min night delivery',
  },
];

export const BIGHI_CATEGORIES: BighiCategory[] = ${JSON.stringify(
  CATEGORIES.map(({ id, label, icon, from, to }) => {
    const c = { id, label, icon, from, to };
    if (CATEGORY_IMAGES[id]) c.image = CATEGORY_IMAGES[id];
    return c;
  }),
  null,
  2,
)};

const RAW_CATALOG: BighiProduct[] = ${JSON.stringify(products, null, 2)};

/** Ids of the ${essentialCount.n} highest-velocity quick-add kirana lines. */
export const BIGHI_ESSENTIAL_IDS: string[] = ${JSON.stringify(essentialIds)};

/**
 * Self-hosted category photo by categoryId. Stored once per category (not
 * repeated across all ${products.length} SKUs) to keep the bundle small.
 * Categories absent here fall back to the branded gradient + icon plate.
 */
export const BIGHI_CATEGORY_IMAGES: Record<string, string> = ${JSON.stringify(CATEGORY_IMAGES, null, 2)};

/**
 * Per-SKU studio pack shots from the Central Product Asset Repository
 * (600x600, /catalog/items/[category]/[sku-slug].jpg). Sourced from the
 * verified manifest public/catalog/catalog-assets.json — ${Object.keys(SKU_IMAGES).length} SKUs in batch 1.
 * Takes precedence over the category photo.
 */
export const BIGHI_SKU_IMAGES: Record<string, string> = ${JSON.stringify(SKU_IMAGES, null, 2)};

const ESSENTIAL_ID_SET = new Set(BIGHI_ESSENTIAL_IDS);

/**
 * The catalog, with the self-hosted photo and quick-add flag resolved onto
 * each SKU from the compact per-category maps above.
 */
export const BIGHI_CATALOG: BighiProduct[] = RAW_CATALOG.map((p) => {
  const image = BIGHI_SKU_IMAGES[p.id] || BIGHI_CATEGORY_IMAGES[p.categoryId];
  return {
    ...p,
    ...(image ? { image } : {}),
    ...(ESSENTIAL_ID_SET.has(p.id) ? { essential: true as const } : {}),
  };
});

export const BIGHI_CATEGORY_COUNTS: Record<string, number> = ${JSON.stringify(byCat, null, 2)};

export const BIGHI_TOTAL_SKUS = ${products.length};

/** Photo for a SKU's category, or undefined → CatalogTile shows the icon plate. */
export function bighiImageFor(categoryId: string): string | undefined {
  return BIGHI_CATEGORY_IMAGES[categoryId];
}

/** Best available photo for a SKU: its own pack shot, else its category photo. */
export function bighiImageForSku(id: string, categoryId: string): string | undefined {
  return BIGHI_SKU_IMAGES[id] || BIGHI_CATEGORY_IMAGES[categoryId];
}

export function isBighiEssential(id: string): boolean {
  return ESSENTIAL_ID_SET.has(id);
}

/**
 * Quick-add essentials — a shopkeeper onboards by tapping these, never by
 * typing a product. Ordered by category for a stable grid.
 */
export const BIGHI_ESSENTIALS: BighiProduct[] = BIGHI_CATALOG.filter((p) =>
  ESSENTIAL_ID_SET.has(p.id),
);

export function bighiEssentialsByCategory(categoryLabel: string): BighiProduct[] {
  if (categoryLabel === 'All') return BIGHI_ESSENTIALS;
  return BIGHI_ESSENTIALS.filter((p) => p.category === categoryLabel);
}

// Quick lookup helpers -------------------------------------------------------
export function bighiProductsByCategory(categoryLabel: string): BighiProduct[] {
  return BIGHI_CATALOG.filter((p) => p.category === categoryLabel);
}

export function bighiProductCountByCategory(categoryLabel: string): number {
  return BIGHI_CATEGORY_COUNTS[categoryLabel] || 0;
}
`;

const outPath = path.join(__dirname, '..', 'src', 'lib', 'bighiCatalog.ts');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, header);

const withPhoto = products.filter((p) => CATEGORY_IMAGES[p.categoryId]).length;
console.log(`Wrote ${products.length} SKUs across ${CATEGORIES.length} categories -> ${path.relative(process.cwd(), outPath)}`);
console.log(`  ${Object.keys(SKU_IMAGES).length} SKUs with a dedicated studio pack shot`);
console.log(`  ${essentialCount.n} quick-add essentials · ${withPhoto} SKUs with a self-hosted photo`);
for (const c of CATEGORIES) {
  console.log(`  ${c.label.padEnd(26)} ${byCat[c.label]}`);
}
