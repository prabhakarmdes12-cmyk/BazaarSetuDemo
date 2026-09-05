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
// Each row is [categoryId, productName, unit, assetSlug].
//
// Deliberately keyed by product IDENTITY, not by `bb-` id: gen-bighi-catalog.cjs
// re-issues sequential ids after an alphabetical sort, so adding a single new
// product line shifts every downstream id. An id-keyed table would still pass
// verification while silently pointing at the wrong products. Identity keys are
// stable across catalog edits, and anything that stops resolving fails loudly.
const SKU_ASSET_ROWS = [
  // Dairy
  ['dairy', "Amul Taaza Fresh Toned Milk", "500 ml pouch", 'dairy/amul-taaza-toned-milk-500ml.jpg'],
  ['dairy', "Amul Gold Full Cream Milk", "1 L pouch", 'dairy/amul-gold-full-cream-milk-1l.jpg'],
  ['dairy', "Amul Butter", "100 g pack", 'dairy/salted-butter-100g.jpg'],
  ['dairy', "Amul Butter", "500 g pack", 'dairy/salted-butter-500g.jpg'],
  ['dairy', "Mother Dairy Butter", "100 g pack", 'dairy/salted-butter-100g.jpg'],
  ['dairy', "Mother Dairy Butter", "500 g pack", 'dairy/salted-butter-500g.jpg'],
  ['dairy', "Amul Masti Fresh Curd / Dahi", "400 g tub", 'dairy/masti-dahi-curd-400g.jpg'],
  ['dairy', "Mother Dairy Fresh Curd / Dahi", "400 g tub", 'dairy/masti-dahi-curd-400g.jpg'],
  ['dairy', "Amul Malai Paneer", "200 g pack", 'dairy/malai-paneer-200g.jpg'],
  ['dairy', "Gowardhan Malai Paneer", "200 g pack", 'dairy/malai-paneer-200g.jpg'],
  ['dairy', "Mother Dairy Malai Paneer", "200 g pack", 'dairy/malai-paneer-200g.jpg'],
  // Vegetables
  ['vegetables', "Desi Tomato", "1 kg", 'vegetables/desi-tomato-1kg.jpg'],
  ['vegetables', "Hybrid Potato", "1 kg", 'vegetables/hybrid-potato-1kg.jpg'],
  ['vegetables', "Red Onion", "1 kg", 'vegetables/red-onion-1kg.jpg'],
  ['vegetables', "Fresh Coriander Bunch", "100 g bunch", 'vegetables/fresh-coriander-100g.jpg'],
  ['vegetables', "Palak / Spinach", "250 g bunch", 'vegetables/palak-spinach-250g.jpg'],
  ['vegetables', "Bhindi / Okra", "500 g", 'vegetables/bhindi-okra-500g.jpg'],
  ['vegetables', "Ginger Root", "250 g", 'vegetables/ginger-250g.jpg'],
  ['vegetables', "Garlic Bulb", "250 g", 'vegetables/garlic-250g.jpg'],
  // Fruits
  ['fruits', "Robusta Banana", "12 pcs", 'fruits/robusta-banana-1kg.jpg'],
  ['fruits', "Shimla Apple", "1 kg", 'fruits/shimla-apple-1kg.jpg'],
  ['fruits', "Mosambi / Sweet Lime", "1 kg", 'fruits/mosambi-1kg.jpg'],
  ['fruits', "Pomegranate / Anar", "1 kg", 'fruits/pomegranate-1kg.jpg'],
  ['fruits', "Seedless Green Grapes", "500 g", 'fruits/green-grapes-500g.jpg'],
  ['fruits', "Papaya", "1 pc ~1.2 kg", 'fruits/papaya-1pc.jpg'],
  // Staples
  ['staples', "Aashirvaad Shudh Chakki Whole Wheat Chakki Atta", "5 kg bag", 'staples/chakki-atta-5kg.jpg'],
  ['staples', "Aashirvaad Shudh Chakki Whole Wheat Chakki Atta", "10 kg bag", 'staples/chakki-atta-10kg.jpg'],
  ['staples', "Fortune Whole Wheat Chakki Atta", "5 kg bag", 'staples/chakki-atta-5kg.jpg'],
  ['staples', "Fortune Whole Wheat Chakki Atta", "10 kg bag", 'staples/chakki-atta-10kg.jpg'],
  ['staples', "India Gate Classic Basmati Rice", "1 kg pack", 'staples/classic-basmati-rice-1kg.jpg'],
  ['staples', "Fortune Basmati Rice", "1 kg pack", 'staples/classic-basmati-rice-1kg.jpg'],
  ['staples', "Tata Sampann Toor / Arhar Dal", "1 kg pack", 'staples/toor-arhar-dal-1kg.jpg'],
  ['staples', "Fortune Toor / Arhar Dal", "1 kg pack", 'staples/toor-arhar-dal-1kg.jpg'],
  // Oils
  ['oils', "Fortune Refined Soyabean Oil", "1 L pouch", 'oils/refined-soyabean-oil-1l.jpg'],
  ['oils', "Saffola Refined Soyabean Oil", "1 L pouch", 'oils/refined-soyabean-oil-1l.jpg'],
  ['oils', "Engine Kachi Ghani Mustard Oil", "1 L bottle", 'oils/kachi-ghani-mustard-oil-1l.jpg'],
  ['oils', "Fortune Kachi Ghani Mustard Oil", "1 L bottle", 'oils/kachi-ghani-mustard-oil-1l.jpg'],
  // Munchies
  ['munchies', "Lay’s Magic Masala Chips", "52 g", 'munchies/masala-potato-chips-52g.jpg'],
  ['munchies', "Lay’s Magic Masala Chips", "78 g family", 'munchies/masala-potato-chips-52g.jpg'],
  ['munchies', "Kurkure Masala Munch Namkeen", "85 g", 'munchies/masala-corn-puffs-70g.jpg'],
  ['munchies', "Haldiram’s Aloo Bhujia", "200 g", 'munchies/aloo-bhujia-200g.jpg'],
  ['munchies', "Bikaji Aloo Bhujia", "200 g", 'munchies/aloo-bhujia-200g.jpg'],
  ['munchies', "Act II Salted Popcorn", "70 g", 'munchies/butter-popcorn-70g.jpg'],
  // Beverages
  ['drinks', "Coca-Cola Soft Drink", "750 ml", 'drinks/cola-750ml.jpg'],
  ['drinks', "Thums Up Cola Soft Drink", "750 ml", 'drinks/masala-cola-750ml.jpg'],
  ['drinks', "Sprite Lime Soft Drink", "750 ml", 'drinks/lime-soda-750ml.jpg'],
  ['drinks', "Maaza Mango Drink", "600 ml", 'drinks/mango-drink-600ml.jpg'],
  // Tea & coffee
  ['tea', "Tata Tea Gold Premium Leaf Tea", "500 g", 'tea/premium-black-tea-500g.jpg'],
  ['tea', "Tata Tea Masala Chai Tea", "500 g", 'tea/premium-black-tea-500g.jpg'],
  ['tea', "Nescafe Classic Instant Coffee Classic", "50 g jar", 'tea/instant-coffee-50g.jpg'],
  ['tea', "Nescafe Sunrise Instant Coffee Classic", "50 g jar", 'tea/instant-coffee-50g.jpg'],
  // Instant
  ['instant', "Maggi 2-Minute Masala Noodles", "4 pack", 'instant/masala-noodles-pack-of-4.jpg'],
  ['instant', "Maggi Noodles Masala Pack", "8 pack", 'instant/masala-noodles-pack-of-8.jpg'],
  ['instant', "Knorr Instant Soup", "4 sachets", 'instant/mixed-veg-soup-sachet.jpg'],
  ['instant', "Ching’s Secret Instant Soup", "4 sachets", 'instant/mixed-veg-soup-sachet.jpg'],
  ['instant', "Kissan Tomato Ketchup", "1 kg", 'instant/tomato-ketchup-1kg.jpg'],
  ['instant', "Heinz Tomato Ketchup", "1 kg", 'instant/tomato-ketchup-1kg.jpg'],
  // Household
  ['household', "Surf Excel Matic Detergent Powder", "1 kg", 'household/matic-detergent-front-load-1kg.jpg'],
  ['household', "Ariel Matic Detergent Powder", "1 kg", 'household/matic-detergent-front-load-1kg.jpg'],
  ['household', "Tide Matic Detergent Powder", "1 kg", 'household/matic-detergent-front-load-1kg.jpg'],
  ['household', "Surf Excel Top-Load Detergent", "1 kg", 'household/matic-detergent-top-load-1kg.jpg'],
  ['household', "Vim Gel Dishwash Gel", "500 ml", 'household/dishwash-gel-500ml.jpg'],
  ['household', "Pril Dishwash Gel", "500 ml", 'household/dishwash-gel-500ml.jpg'],
  ['household', "Exo Dishwash Gel", "500 ml", 'household/dishwash-gel-500ml.jpg'],
  ['household', "Harpic Power Plus Toilet Cleaner", "1 L", 'household/toilet-cleaner-1l.jpg'],
  ['household', "Lizol Toilet Cleaner", "1 L", 'household/toilet-cleaner-1l.jpg'],
  ['household', "Lizol Floor Cleaner", "1 L", 'household/pine-floor-cleaner-1l.jpg'],
  ['household', "Domex Floor Cleaner", "1 L", 'household/pine-floor-cleaner-1l.jpg'],

  // ---- Batch 2 -------------------------------------------------------------
  // Pooja & festive needs
  ['pooja', "Mangaldeep Agarbatti Incense Sticks", "50 sticks", 'pooja/agarbatti-sandalwood-box.jpg'],
  ['pooja', "Cycle Agarbatti Incense Sticks", "50 sticks", 'pooja/agarbatti-sandalwood-box.jpg'],
  ['pooja', "Zed Black Agarbatti Incense Sticks", "50 sticks", 'pooja/agarbatti-rose-box.jpg'],
  ['pooja', "Mangaldeep Ghee Diya Batti Ready", "6 pcs", 'pooja/cow-ghee-diya-pack.jpg'],
  ['pooja', "Local Ghee Diya Batti Ready", "6 pcs", 'pooja/cow-ghee-diya-pack.jpg'],
  ['pooja', "Cycle Camphor Kapur Tablets", "50 g", 'pooja/camphor-kapoor-box.jpg'],
  ['pooja', "Mangalam Camphor Kapur Tablets", "50 g", 'pooja/camphor-kapoor-box.jpg'],
  ['pooja', "Local Kumkum Roli Powder", "50 g", 'pooja/roli-kumkum-chandan-pack.jpg'],
  ['pooja', "Local Haldi Chandan Tika", "50 g", 'pooja/roli-kumkum-chandan-pack.jpg'],
  ['pooja', "Local Havan Samagri", "500 g", 'pooja/hawan-samagri-500g.jpg'],
  ['pooja', "Patanjali Havan Samagri", "500 g", 'pooja/hawan-samagri-500g.jpg'],
  ['pooja', "Local Mauli Kalava Sacred Thread", "1 roll", 'pooja/mauli-kalawa-thread.jpg'],
  ['pooja', "Local Brass Diya Lamp", "1 pc small", 'pooja/brass-diya-single.jpg'],
  ['pooja', "Local Brass Diya Lamp", "1 pc medium", 'pooja/brass-diya-single.jpg'],
  // Dry fruits & regional staples
  ['dryfruits', "Bihar Special Phool Makhana Fox Nuts", "250 g", 'dryfruits/phool-makhana-250g.jpg'],
  ['dryfruits', "Happilo Phool Makhana Fox Nuts", "250 g", 'dryfruits/phool-makhana-250g.jpg'],
  ['dryfruits', "Local Phool Makhana Fox Nuts", "250 g", 'dryfruits/phool-makhana-250g.jpg'],
  ['munchies', "Bikaji Chana Jor Garam", "200 g", 'dryfruits/roasted-chana-sattu-500g.jpg'],
  ['staples', "Local Poha Flattened Rice", "500 g", 'dryfruits/poha-chooda-500g.jpg'],
  ['staples', "Fortune Poha Flattened Rice", "500 g", 'dryfruits/poha-chooda-500g.jpg'],
  ['dryfruits', "Vedaka Almonds California", "200 g", 'dryfruits/almonds-badam-200g.jpg'],
  ['dryfruits', "Happilo Almonds California", "200 g", 'dryfruits/almonds-badam-200g.jpg'],
  ['dryfruits', "Nutraj Almonds California", "200 g", 'dryfruits/almonds-badam-200g.jpg'],
  ['dryfruits', "Vedaka Cashew Whole W240", "200 g", 'dryfruits/cashew-kaju-200g.jpg'],
  ['dryfruits', "Happilo Cashew Whole W240", "200 g", 'dryfruits/cashew-kaju-200g.jpg'],
  ['dryfruits', "Nutraj Cashew Whole W240", "200 g", 'dryfruits/cashew-kaju-200g.jpg'],
  ['dryfruits', "Vedaka Raisins Kishmish", "250 g", 'dryfruits/kishmish-raisins-200g.jpg'],
  ['dryfruits', "Happilo Raisins Kishmish", "250 g", 'dryfruits/kishmish-raisins-200g.jpg'],
  ['dryfruits', "Nutraj Raisins Kishmish", "250 g", 'dryfruits/kishmish-raisins-200g.jpg'],
  ['staples', "Tata Sampann Besan Gram Flour", "1 kg", 'staples/besan-gram-flour-1kg.jpg'],
  ['staples', "24 Mantra Besan Gram Flour", "1 kg", 'staples/besan-gram-flour-1kg.jpg'],
  ['staples', "Fortune Besan Gram Flour", "1 kg", 'staples/besan-gram-flour-1kg.jpg'],
  // Spices & masalas (the catalog files masalas under the `oils` category)
  ['oils', "Tata Haldi / Turmeric Powder", "200 g", 'spices/haldi-turmeric-200g.jpg'],
  ['oils', "MDH Haldi / Turmeric Powder", "200 g", 'spices/haldi-turmeric-200g.jpg'],
  ['oils', "24 Mantra Haldi / Turmeric Powder", "200 g", 'spices/haldi-turmeric-200g.jpg'],
  ['oils', "MDH Deggi Mirch Chilli Powder", "200 g", 'spices/lal-mirch-chilli-200g.jpg'],
  ['oils', "Everest Deggi Mirch Chilli Powder", "200 g", 'spices/lal-mirch-chilli-200g.jpg'],
  ['oils', "Catch Deggi Mirch Chilli Powder", "200 g", 'spices/lal-mirch-chilli-200g.jpg'],
  ['oils', "MDH Dhania / Coriander Powder", "200 g", 'spices/dhaniya-coriander-200g.jpg'],
  ['oils', "Everest Dhania / Coriander Powder", "200 g", 'spices/dhaniya-coriander-200g.jpg'],
  ['oils', "Catch Dhania / Coriander Powder", "200 g", 'spices/dhaniya-coriander-200g.jpg'],
  ['oils', "MDH Garam Masala", "100 g", 'spices/garam-masala-100g.jpg'],
  ['oils', "Everest Garam Masala", "100 g", 'spices/garam-masala-100g.jpg'],
  ['oils', "Catch Garam Masala", "100 g", 'spices/garam-masala-100g.jpg'],
  ['oils', "MDH Kitchen King Masala", "100 g", 'spices/chicken-meat-masala-100g.jpg'],
  ['oils', "Everest Kitchen King Masala", "100 g", 'spices/chicken-meat-masala-100g.jpg'],
  // Salts & ghee
  ['staples', "Tata Salt Iodised Salt", "1 kg pack", 'spices/iodised-salt-1kg.jpg'],
  ['staples', "Tata Salt Rock Salt / Sendha Namak", "1 kg pack", 'spices/rock-salt-sendha-1kg.jpg'],
  ['staples', "Patanjali Rock Salt / Sendha Namak", "1 kg pack", 'spices/rock-salt-sendha-1kg.jpg'],
  ['staples', "Local Rock Salt / Sendha Namak", "1 kg pack", 'spices/rock-salt-sendha-1kg.jpg'],
  ['staples', "Aashirvaad Salt Iodised Salt", "1 kg pack", 'spices/iodised-salt-1kg.jpg'],
  ['oils', "Amul Cow Ghee Cow Ghee", "500 ml", 'dairy/pure-cow-ghee-500ml.jpg'],
  ['oils', "Mother Dairy Cow Ghee", "500 ml", 'dairy/pure-cow-ghee-500ml.jpg'],
  ['oils', "Nestle a+ Cow Ghee", "500 ml", 'dairy/pure-cow-ghee-500ml.jpg'],
  // Bakery & breads
  ['dairy', "Britannia White Sandwich Bread", "400 g loaf", 'dairy/white-bread-400g.jpg'],
  ['dairy', "Harvest Gold White Sandwich Bread", "400 g loaf", 'dairy/white-bread-400g.jpg'],
  ['dairy', "Modern White Sandwich Bread", "400 g loaf", 'dairy/white-bread-400g.jpg'],
  ['dairy', "Britannia Brown Bread", "400 g loaf", 'dairy/brown-bread-400g.jpg'],
  ['dairy', "Harvest Gold Brown Bread", "400 g loaf", 'dairy/brown-bread-400g.jpg'],
  ['dairy', "Modern Brown Bread", "400 g loaf", 'dairy/brown-bread-400g.jpg'],
  ['dairy', "Harvest Gold Pav Buns", "6 pcs pack", 'dairy/pav-bun-6-pack.jpg'],
  ['dairy', "Modern Pav Buns", "6 pcs pack", 'dairy/pav-bun-6-pack.jpg'],
  ['biscuits', "Britannia Toastea Suji Rusk", "200 g", 'biscuits/suji-rusk-toast-300g.jpg'],
  ['biscuits', "Parle Rusk Suji Rusk", "200 g", 'biscuits/suji-rusk-toast-300g.jpg'],
  ['biscuits', "Modern Suji Rusk", "200 g", 'biscuits/suji-rusk-toast-300g.jpg'],
  ['biscuits', "Parle-G Gold Glucose Biscuits", "100 g", 'biscuits/glucose-biscuits-250g.jpg'],
  ['biscuits', "Britannia Good Day Cashew Cookies", "250 g", 'biscuits/butter-cookies-150g.jpg'],
  // Spreads (catalog files jams under the `breakfast` category)
  ['breakfast', "Kissan Mixed Fruit Jam", "500 g", 'instant/mixed-fruit-jam-500g.jpg'],
  ['breakfast', "Patanjali Mixed Fruit Jam", "500 g", 'instant/mixed-fruit-jam-500g.jpg'],
  ['breakfast', "Tops Mixed Fruit Jam", "500 g", 'instant/mixed-fruit-jam-500g.jpg'],
  // Personal care & hygiene
  ['personal', "Dettol Original Germ Protection Soap", "4 pack", 'personal/antibacterial-soap-pack-of-3.jpg'],
  ['personal', "Lifebuoy Germ Protection Soap", "4 pack", 'personal/antibacterial-soap-pack-of-3.jpg'],
  ['personal', "Savlon Germ Protection Soap", "4 pack", 'personal/antibacterial-soap-pack-of-3.jpg'],
  ['personal', "Dove Cream Bar Beauty Bathing Bar", "100 g", 'personal/moisturising-beauty-bar-75g.jpg'],
  ['personal', "Lux Beauty Bathing Bar", "100 g", 'personal/moisturising-beauty-bar-75g.jpg'],
  ['personal', "Pears Beauty Bathing Bar", "100 g", 'personal/moisturising-beauty-bar-75g.jpg'],
  ['personal', "Head & Shoulders Anti-Dandruff Shampoo", "180 ml", 'personal/anti-dandruff-shampoo-180ml.jpg'],
  ['personal', "Clinic Plus Anti-Dandruff Shampoo", "180 ml", 'personal/anti-dandruff-shampoo-180ml.jpg'],
  ['personal', "Dove Anti-Dandruff Shampoo", "180 ml", 'personal/anti-dandruff-shampoo-180ml.jpg'],
  ['personal', "Sensodyne Strong Teeth Toothpaste", "100 g", 'personal/herbal-red-toothpaste-150g.jpg'],
  ['personal', "Colgate Strong Teeth Strong Teeth Toothpaste", "100 g", 'personal/mint-gel-toothpaste-150g.jpg'],
  ['personal', "Pepsodent Strong Teeth Toothpaste", "100 g", 'personal/mint-gel-toothpaste-150g.jpg'],
  ['personal', "Colgate Toothbrush", "4 pack soft", 'personal/soft-toothbrush-pack-of-2.jpg'],
  ['personal', "Oral-B Toothbrush", "4 pack soft", 'personal/soft-toothbrush-pack-of-2.jpg'],
  ['personal', "Sensodyne Toothbrush", "4 pack soft", 'personal/soft-toothbrush-pack-of-2.jpg'],
  ['personal', "Gillette Shaving Foam", "200 ml", 'personal/shaving-foam-200ml.jpg'],
  ['personal', "Old Spice Shaving Foam", "200 ml", 'personal/shaving-foam-200ml.jpg'],
  ['personal', "Park Avenue Shaving Foam", "200 ml", 'personal/shaving-foam-200ml.jpg'],
  ['personal', "Gillette Manual Razor", "1 razor", 'personal/twin-blade-razors-pack-of-5.jpg'],
  ['personal', "7 O’clock Manual Razor", "1 razor", 'personal/twin-blade-razors-pack-of-5.jpg'],
  // Baby care
  ['baby', "Pampers Diapers Pants", "M · 36 pcs", 'baby/baby-diaper-pants-m-32.jpg'],
  ['baby', "Huggies Diapers Pants", "M · 36 pcs", 'baby/baby-diaper-pants-m-32.jpg'],
  ['baby', "MamyPoko Diapers Pants", "M · 36 pcs", 'baby/baby-diaper-pants-m-32.jpg'],
  ['baby', "Pampers Diapers Pants", "L · 34 pcs", 'baby/baby-diaper-pants-l-30.jpg'],
  ['baby', "Huggies Diapers Pants", "L · 34 pcs", 'baby/baby-diaper-pants-l-30.jpg'],
  ['baby', "MamyPoko Diapers Pants", "L · 34 pcs", 'baby/baby-diaper-pants-l-30.jpg'],
  ['baby', "Johnson’s Baby Wipes", "72 wipes pack", 'baby/baby-gentle-wipes-72.jpg'],
  ['baby', "Pampers Baby Wipes", "72 wipes pack", 'baby/baby-gentle-wipes-72.jpg'],
  ['baby', "MamyPoko Baby Wipes", "72 wipes pack", 'baby/baby-gentle-wipes-72.jpg'],
  ['baby', "Nestle Cerelac Infant Cereal", "300 g", 'baby/infant-wheat-apple-cereal-300g.jpg'],
  ['baby', "Nestum Infant Cereal", "300 g", 'baby/infant-wheat-apple-cereal-300g.jpg'],
  ['baby', "Himalaya Baby Soap", "75 g", 'baby/baby-gentle-soap-75g.jpg'],
  ['baby', "Johnson’s Baby Soap", "75 g", 'baby/baby-gentle-soap-75g.jpg'],
  ['baby', "Sebamed Baby Soap", "75 g", 'baby/baby-gentle-soap-75g.jpg'],
  // OTC wellness & first aid
  ['pharma', "Dolo 650 Paracetamol 500mg Tablets", "10 tablets", 'pharma/paracetamol-strip-15.jpg'],
  ['pharma', "Crocin Paracetamol 500mg Tablets", "10 tablets", 'pharma/paracetamol-strip-15.jpg'],
  ['pharma', "Calpol Paracetamol 500mg Tablets", "10 tablets", 'pharma/paracetamol-strip-15.jpg'],
  ['pharma', "Limcee Chewable Vitamin C Tablets", "15 tablets", 'pharma/vitamin-c-chewable-15.jpg'],
  ['pharma', "Celin Chewable Vitamin C Tablets", "15 tablets", 'pharma/vitamin-c-chewable-15.jpg'],
  ['pharma', "Zandu Pain Relief Balm Jar", "50 g", 'pharma/pain-relief-balm-50g.jpg'],
  ['pharma', "Amrutanjan Pain Relief Balm Jar", "50 g", 'pharma/pain-relief-balm-50g.jpg'],
  ['pharma', "Tiger Balm Pain Relief Balm Jar", "50 g", 'pharma/pain-relief-balm-50g.jpg'],
  ['pharma', "Dettol Antiseptic Liquid", "100 ml", 'pharma/antiseptic-liquid-100ml.jpg'],
  ['pharma', "Savlon Antiseptic Liquid", "100 ml", 'pharma/antiseptic-liquid-100ml.jpg'],
  ['pharma', "Band-Aid Adhesive Bandages", "pack of 10", 'pharma/adhesive-bandages-10.jpg'],
  ['pharma', "Dettol Adhesive Bandages", "pack of 10", 'pharma/adhesive-bandages-10.jpg'],
  ['pharma', "Eno Antacid Fruit Salt Sachet", "5 g sachet", 'pharma/fruit-salt-sachet-pack.jpg'],
  ['pharma', "Gelusil Antacid Fruit Salt Sachet", "5 g sachet", 'pharma/fruit-salt-sachet-pack.jpg'],
  ['pharma', "Glucon-D Glucose Energy Powder", "500 g", 'pharma/glucose-energy-powder-500g.jpg'],
  ['pharma', "Dabur Glucose Energy Powder", "500 g", 'pharma/glucose-energy-powder-500g.jpg'],
  ['pharma', "Strepsils Cough Lozenges", "pack of 20", 'pharma/cough-lozenges-20.jpg'],
  ['pharma', "Vicks Cough Lozenges", "pack of 20", 'pharma/cough-lozenges-20.jpg'],
  ['pharma', "Halls Cough Lozenges", "pack of 20", 'pharma/cough-lozenges-20.jpg'],
  // ---- Batch 3 -------------------------------------------------------------
  // Chocolates & sweets
  ['chocolates', "Cadbury Dairy Milk Silk Chocolate Bar", "60 g", 'chocolates/milk-chocolate-bar-50g.jpg'],
  ['chocolates', "Amul Milk Chocolate Bar", "40 g", 'chocolates/milk-chocolate-bar-50g.jpg'],
  ['chocolates', "KitKat Crispy Wafer Chocolate", "4-pack 8 fingers", 'chocolates/wafer-finger-bar-4-finger.jpg'],
  ['chocolates', "Alpenliebe Gold Toffee Jar", "jar ~100 pcs", 'chocolates/eclairs-toffee-200g.jpg'],
  ['chocolates', "Melody Toffee Jar", "jar ~100 pcs", 'chocolates/eclairs-toffee-200g.jpg'],
  ['chocolates', "Haldiram\u2019s Gulab Jamun Tin", "1 kg tin", 'chocolates/gulab-jamun-tin-1kg.jpg'],
  ['chocolates', "Bikaji Gulab Jamun Tin", "1 kg tin", 'chocolates/gulab-jamun-tin-1kg.jpg'],
  ['chocolates', "Haldiram\u2019s Rasgulla Tin", "1 kg tin", 'chocolates/rasgulla-tin-1kg.jpg'],
  ['chocolates', "Bikaji Rasgulla Tin", "1 kg tin", 'chocolates/rasgulla-tin-1kg.jpg'],
  ['chocolates', "Haldiram\u2019s Soan Papdi", "250 g", 'chocolates/soan-papdi-box-250g.jpg'],
  ['chocolates', "Bikaji Soan Papdi", "250 g", 'chocolates/soan-papdi-box-250g.jpg'],
  ['chocolates', "Cadbury Bournville Dark Chocolate", "55 g", 'chocolates/dark-chocolate-slab-80g.jpg'],
  ['chocolates', "Amul Dark Chocolate", "55 g", 'chocolates/dark-chocolate-slab-80g.jpg'],
  ['munchies', "Haldiram\u2019s Peanut Chikki", "200 g", 'chocolates/peanut-chikki-150g.jpg'],
  ['munchies', "Jabsons Peanut Chikki", "200 g", 'chocolates/peanut-chikki-150g.jpg'],
  // Cold drinks
  ['drinks', "Sprite Lime Soft Drink", "1.25 L", 'drinks/lemon-lime-soda-1250ml.jpg'],
  ['drinks', "7Up Lime Soft Drink", "1.25 L", 'drinks/lemon-lime-soda-1250ml.jpg'],
  ['drinks', "Fanta Orange Fizzy Drink", "750 ml", 'drinks/orange-fizzy-750ml.jpg'],
  ['drinks', "Mirinda Orange Fizzy Drink", "750 ml", 'drinks/orange-fizzy-750ml.jpg'],
  // Cold drinks, juices & mixers
  ['drinks', "Real Fruit Power Apple Juice", "1 L carton", 'drinks/apple-juice-tetra-1l.jpg'],
  ['drinks', "Tropicana Apple Juice", "1 L carton", 'drinks/apple-juice-tetra-1l.jpg'],
  ['drinks', "Real Fruit Power Mixed Fruit Juice", "1 L carton", 'drinks/mixed-fruit-juice-tetra-1l.jpg'],
  ['drinks', "Tropicana Mixed Fruit Juice", "1 L carton", 'drinks/mixed-fruit-juice-tetra-1l.jpg'],
  ['drinks', "Paper Boat Guava Chili Juice", "1 L carton", 'drinks/guava-chili-juice-1l.jpg'],
  ['drinks', "Real Fruit Power Guava Chili Juice", "1 L carton", 'drinks/guava-chili-juice-1l.jpg'],
  ['drinks', "Real Tender Coconut Water", "200 ml", 'drinks/coconut-water-250ml.jpg'],
  ['drinks', "Coco Tender Coconut Water", "200 ml", 'drinks/coconut-water-250ml.jpg'],
  ['drinks', "Red Bull Energy Drink", "250 ml can", 'drinks/energy-drink-can-250ml.jpg'],
  ['drinks', "Sting Energy Drink", "250 ml can", 'drinks/energy-drink-can-250ml.jpg'],
  ['drinks', "Monster Energy Drink", "250 ml can", 'drinks/energy-drink-can-250ml.jpg'],
  ['drinks', "Paper Boat Jeera Masala Soda", "600 ml", 'drinks/jeera-masala-soda-600ml.jpg'],
  ['drinks', "Campa Jeera Masala Soda", "600 ml", 'drinks/jeera-masala-soda-600ml.jpg'],
  ['drinks', "Local Jeera Masala Soda", "600 ml", 'drinks/jeera-masala-soda-600ml.jpg'],
  ['drinks', "Bisleri Packaged Water", "1 L bottle", 'drinks/mineral-water-1l.jpg'],
  ['drinks', "Aquafina Packaged Water", "1 L bottle", 'drinks/mineral-water-1l.jpg'],
  ['drinks', "Kinley Packaged Water", "1 L bottle", 'drinks/mineral-water-1l.jpg'],
  ['drinks', "Amul Lassi Sweet", "200 ml", 'drinks/lassi-bottle-200ml.jpg'],
  ['drinks', "Mother Dairy Lassi Sweet", "200 ml", 'drinks/lassi-bottle-200ml.jpg'],
  // Breakfast & cereals
  ['breakfast', "Kellogg\u2019s Corn Flakes", "475 g", 'breakfast/corn-flakes-500g.jpg'],
  ['breakfast', "Bagrry\u2019s Corn Flakes", "475 g", 'breakfast/corn-flakes-500g.jpg'],
  ['breakfast', "Patanjali Corn Flakes", "475 g", 'breakfast/corn-flakes-500g.jpg'],
  ['breakfast', "Kellogg\u2019s Chocos Cereal", "300 g", 'breakfast/choco-flakes-375g.jpg'],
  ['breakfast', "Bagrry\u2019s Chocos Cereal", "300 g", 'breakfast/choco-flakes-375g.jpg'],
  // Batch 3 part 3 — breakfast, frozen & home essentials
  ['breakfast', "Quaker Rolled Oats", "1 kg", 'breakfast/instant-oats-500g.jpg'],
  ['breakfast', "Saffola Rolled Oats", "1 kg", 'breakfast/instant-oats-500g.jpg'],
  ['breakfast', "Bagrry\u2019s Rolled Oats", "1 kg", 'breakfast/instant-oats-500g.jpg'],
  ['breakfast', "Kellogg\u2019s Muesli Fruit & Nut", "400 g", 'breakfast/muesli-fruit-nut-400g.jpg'],
  ['breakfast', "Bagrry\u2019s Muesli Fruit & Nut", "400 g", 'breakfast/muesli-fruit-nut-400g.jpg'],
  ['breakfast', "Soulfull Muesli Fruit & Nut", "400 g", 'breakfast/muesli-fruit-nut-400g.jpg'],
  ['staples', "Aashirvaad Sooji / Rava", "500 g", 'staples/sooji-rawa-500g.jpg'],
  ['staples', "Fortune Sooji / Rava", "500 g", 'staples/sooji-rawa-500g.jpg'],
  ['frozen', "Safal Frozen Green Peas", "500 g", 'frozen/green-peas-frozen-500g.jpg'],
  ['frozen', "Godrej Yummiez Frozen Green Peas", "500 g", 'frozen/green-peas-frozen-500g.jpg'],
  ['frozen', "McCain Frozen French Fries", "420 g", 'frozen/french-fries-frozen-400g.jpg'],
  ['frozen', "ITC Master Chef Frozen French Fries", "420 g", 'frozen/french-fries-frozen-400g.jpg'],
  ['frozen', "McCain Aloo Tikki Frozen", "400 g", 'frozen/aloo-tikki-frozen-400g.jpg'],
  ['frozen', "Godrej Yummiez Aloo Tikki Frozen", "400 g", 'frozen/aloo-tikki-frozen-400g.jpg'],
  ['frozen', "Safal Frozen Sweet Corn", "500 g", 'frozen/sweet-corn-frozen-500g.jpg'],
  ['frozen', "Godrej Yummiez Frozen Sweet Corn", "500 g", 'frozen/sweet-corn-frozen-500g.jpg'],
  ['dairy', "Amul Processed Cheese Slices", "200 g", 'dairy/cheese-slices-10-pack-200g.jpg'],
  ['dairy', "Britannia Processed Cheese Slices", "200 g", 'dairy/cheese-slices-10-pack-200g.jpg'],
  ['household', "Vim Dishwash Bar", "3 pack", 'household/dishwash-bar-3-pack.jpg'],
  ['household', "Exo Dishwash Bar", "3 pack", 'household/dishwash-bar-3-pack.jpg'],
  ['household', "Pril Dishwash Bar", "3 pack", 'household/dishwash-bar-3-pack.jpg'],
  ['household', "Shalimar Garbage Bags", "30 bags medium", 'household/garbage-bags-30-medium.jpg'],
  ['household', "Origami Garbage Bags", "30 bags medium", 'household/garbage-bags-30-medium.jpg'],
  // Batch 3 part 4 — home & kitchen, paan corner
  ['household', "Hindalco Aluminium Foil", "9 m", 'household/aluminium-foil-9m.jpg'],
  ['household', "Reynolds Aluminium Foil", "9 m", 'household/aluminium-foil-9m.jpg'],
  ['household', "Origami Kitchen Towel Roll", "2 rolls 2-ply", 'household/kitchen-tissue-2-pack.jpg'],
  ['household', "Premier Kitchen Towel Roll", "2 rolls 2-ply", 'household/kitchen-tissue-2-pack.jpg'],
  ['household', "Good Knight Mosquito Repellent Refill", "45 ml refill", 'household/mosquito-repellent-refill-45ml.jpg'],
  ['household', "AllOut Mosquito Repellent Refill", "45 ml refill", 'household/mosquito-repellent-refill-45ml.jpg'],
  ['household', "Hit Mosquito Repellent Refill", "45 ml refill", 'household/mosquito-repellent-refill-45ml.jpg'],
  ['paan', "Rajnigandha Meetha Saunf Mukhwas", "100 g", 'paan/silver-pearls-mukhwas-tin.jpg'],
  ['paan', "Local Meetha Saunf Mukhwas", "100 g", 'paan/silver-pearls-mukhwas-tin.jpg'],
  ['paan', "Local Silver Coated Elaichi", "50 g", 'paan/silver-coated-elaichi-50g.jpg'],
  ['paan', "Rajnigandha Paan Masala Mouth Freshener", "10 sachets", 'paan/paan-masala-mouth-freshener-sachets.jpg'],
  ['paan', "Pass Paan Masala Mouth Freshener", "10 sachets", 'paan/paan-masala-mouth-freshener-sachets.jpg'],
  ['paan', "Center Fresh Chocolate Mint Pellets", "jar", 'paan/mint-pellets-jar.jpg'],
  ['paan', "Pass Chocolate Mint Pellets", "jar", 'paan/mint-pellets-jar.jpg'],
  ['paan', "Orbit Spearmint Chewing Gum", "blister pack", 'paan/spearmint-chewing-gum-pack.jpg'],
  ['paan', "Center Fresh Spearmint Chewing Gum", "blister pack", 'paan/spearmint-chewing-gum-pack.jpg'],
  ['paan', "Happydent Spearmint Chewing Gum", "blister pack", 'paan/spearmint-chewing-gum-pack.jpg'],
  ['paan', "Local Roasted Saunf", "100 g", 'paan/roasted-saunf-100g.jpg'],
  ['paan', "Hajmola Digestive Anardana Goli", "100 g", 'paan/anardana-goli-100g.jpg'],
  ['paan', "Local Digestive Anardana Goli", "100 g", 'paan/anardana-goli-100g.jpg'],
  // ---- Batch 4: national high-velocity FMCG core -----------------------------
  // Instant food & noodles
  ['instant', "Maggi 2-Minute Masala Noodles", "70 g", 'instant/maggi-2-minute-noodles-70g.jpg'],
  ['instant', "Sunfeast YiPPee! 2-Minute Masala Noodles", "70 g", 'instant/maggi-2-minute-noodles-70g.jpg'],
  ['instant', "Knorr 2-Minute Masala Noodles", "4 pack", 'instant/maggi-masala-noodles-4-pack.jpg'],
  ['instant', "Maggi 2-Minute Masala Noodles", "12 pack family", 'instant/maggi-masala-noodles-4-pack.jpg'],
  ['instant', "Sunfeast YiPPee! 2-Minute Masala Noodles", "4 pack", 'instant/yippee-magic-masala-noodles-4-pack.jpg'],
  ['instant', "Knorr Mast Masala Soupy Noodles", "70 g", 'instant/knorr-soupy-noodles-pouch.jpg'],
  ['instant', "Maggi Soupy Noodles", "70 g", 'instant/knorr-soupy-noodles-pouch.jpg'],
  ['instant', "Top Ramen Curry Veg Noodles", "70 g", 'instant/top-ramen-curry-noodles-single.jpg'],
  ['instant', "Ching\u2019s Secret Curry Veg Noodles", "70 g", 'instant/top-ramen-curry-noodles-single.jpg'],
  ['staples', "Fortune Soya Chunks", "200 g", 'instant/soya-chunks-fortune-200g.jpg'],
  ['staples', "Nutrela Soya Chunks", "200 g", 'instant/soya-chunks-fortune-200g.jpg'],
  ['staples', "Patanjali Soya Chunks", "200 g", 'instant/soya-chunks-fortune-200g.jpg'],
  // Everyday biscuits & cookies
  ['biscuits', "Parle-G Gold Glucose Biscuits", "250 g", 'biscuits/parle-g-glucose-biscuit-250g.jpg'],
  ['biscuits', "Parle-G Gold Glucose Biscuits", "800 g family", 'biscuits/parle-g-family-pack-800g.jpg'],
  ['biscuits', "Britannia Marie Gold Marie Gold Biscuits", "250 g", 'biscuits/britannia-marie-gold-300g.jpg'],
  ['biscuits', "Parle Marie Gold Biscuits", "250 g", 'biscuits/britannia-marie-gold-300g.jpg'],
  ['biscuits', "Britannia Good Day Cashew Cookies", "100 g", 'biscuits/britannia-good-day-cashew-120g.jpg'],
  // Batch 4 group B/C: premium biscuits, tea & coffee, salt
  ['biscuits', "Sunfeast Dark Fantasy Choco Fills Cookies", "150 g", 'biscuits/dark-fantasy-choco-fills-150g.jpg'],
  ['biscuits', "Cadbury Bournvita Biscuits Choco Fills Cookies", "150 g", 'biscuits/dark-fantasy-choco-fills-150g.jpg'],
  ['biscuits', "Parle Monaco Salted Biscuits", "200 g", 'biscuits/monaco-salted-biscuit-200g.jpg'],
  ['tea', "Tata Agni Premium Leaf Tea", "500 g", 'tea/tata-tea-premium-500g.jpg'],
  ['tea', "Tetley Premium Leaf Tea", "500 g", 'tea/tata-tea-premium-500g.jpg'],
  ['tea', "Red Label Premium Leaf Tea", "500 g", 'tea/red-label-tea-500g.jpg'],
  ['tea', "Brooke Bond Red Label Strong CTC Tea", "500 g", 'tea/red-label-tea-500g.jpg'],
  ['tea', "Tata Tea Taaza Strong CTC Tea", "250 g", 'tea/tata-tea-taaza-250g.jpg'],
  ['tea', "Society Strong CTC Tea", "250 g", 'tea/tata-tea-taaza-250g.jpg'],
  ['tea', "Wagh Bakri Strong CTC Tea", "250 g", 'tea/tata-tea-taaza-250g.jpg'],
  ['tea', "Taj Mahal Premium Leaf Tea", "250 g", 'tea/taj-mahal-tea-250g.jpg'],
  ['tea', "Tata Tea Gold Premium Leaf Tea", "250 g", 'tea/taj-mahal-tea-250g.jpg'],
  ['tea', "Nescafe Classic Instant Coffee Classic", "100 g jar", 'tea/nescafe-classic-coffee-50g.jpg'],
  ['tea', "Continental Premium Instant Coffee", "50 g", 'tea/nescafe-classic-coffee-50g.jpg'],
  ['tea', "Bru Instant Premium Instant Coffee", "50 g", 'tea/bru-instant-coffee-50g.jpg'],
  ['tea', "Bru Gold Premium Instant Coffee", "50 g", 'tea/bru-instant-coffee-50g.jpg'],
  ['staples', "Tata Salt Iodised Salt", "250 g", 'staples/tata-salt-1kg.jpg'],
  ['staples', "Aashirvaad Salt Iodised Salt", "250 g", 'staples/tata-salt-1kg.jpg'],
  ['staples', "Tata Salt Lite Low Sodium Salt", "1 kg pack", 'staples/tata-salt-lite-1kg.jpg'],
  // Batch 4 group D/E: sugar, oils & ghee, soaps, oral care
  ['staples', "Madhur Sugar / Cheeni", "1 kg pack", 'staples/madhur-sugar-1kg.jpg'],
  ['staples', "Tata Sugar / Cheeni", "1 kg pack", 'staples/madhur-sugar-1kg.jpg'],
  ['staples', "Parry\u2019s Sugar / Cheeni", "1 kg pack", 'staples/madhur-sugar-1kg.jpg'],
  ['oils', "Fortune Sunlite Refined Sunflower Oil", "1 L pouch", 'oils/fortune-sunflower-oil-1l.jpg'],
  ['oils', "Dhara Refined Sunflower Oil", "1 L pouch", 'oils/fortune-sunflower-oil-1l.jpg'],
  ['oils', "Nature Fresh Refined Sunflower Oil", "1 L pouch", 'oils/fortune-sunflower-oil-1l.jpg'],
  ['oils', "Saffola Refined Sunflower Oil", "1 L pouch", 'oils/fortune-sunflower-oil-1l.jpg'],
  ['oils', "Fortune Kachi Ghani Mustard Oil", "1 L pouch", 'oils/fortune-mustard-oil-1l.jpg'],
  ['oils', "Dhara Kachi Ghani Mustard Oil", "1 L pouch", 'oils/fortune-mustard-oil-1l.jpg'],
  ['oils', "Patanjali Kachi Ghani Mustard Oil", "1 L pouch", 'oils/fortune-mustard-oil-1l.jpg'],
  ['oils', "Amul Cow Ghee Cow Ghee", "1 L jar", 'oils/amul-ghee-1l-tin.jpg'],
  ['oils', "Mother Dairy Cow Ghee", "1 L jar", 'oils/amul-ghee-1l-tin.jpg'],
  ['oils', "Nestle a+ Cow Ghee", "1 L jar", 'oils/amul-ghee-1l-tin.jpg'],
  ['personal', "Dettol Original Germ Protection Soap", "3 pack", 'personal/dettol-soap-3-pack.jpg'],
  ['personal', "Savlon Germ Protection Soap", "3 pack", 'personal/dettol-soap-3-pack.jpg'],
  ['personal', "Lifebuoy Germ Protection Soap", "3 pack", 'personal/lifebuoy-soap-3-pack.jpg'],
  ['personal', "Dove Cream Bar Beauty Bathing Bar", "3 pack", 'personal/dove-soap-100g.jpg'],
  ['personal', "Lux Beauty Bathing Bar", "3 pack", 'personal/dove-soap-100g.jpg'],
  ['personal', "Pears Beauty Bathing Bar", "3 pack", 'personal/pears-soap-100g.jpg'],
  ['personal', "Colgate Strong Teeth Strong Teeth Toothpaste", "200 g", 'personal/colgate-strong-teeth-200g.jpg'],
  ['personal', "Pepsodent Strong Teeth Toothpaste", "200 g", 'personal/colgate-strong-teeth-200g.jpg'],
  ['personal', "Colgate MaxFresh Cooling Gel Toothpaste", "150 g", 'personal/colgate-maxfresh-gel-150g.jpg'],
  ['personal', "Pepsodent Cooling Gel Toothpaste", "150 g", 'personal/colgate-maxfresh-gel-150g.jpg'],
  // Batch 4 group E/F/G: oral care, hair care, grooming, laundry
  ['personal', "Close Up Cooling Gel Toothpaste", "150 g", 'personal/close-up-red-gel-150g.jpg'],
  ['personal', "Sensodyne Sensitivity Relief Toothpaste", "75 g", 'personal/sensodyne-sensitive-75g.jpg'],
  ['personal', "Colgate Sensitive Sensitivity Relief Toothpaste", "75 g", 'personal/sensodyne-sensitive-75g.jpg'],
  ['personal', "Vantej Sensitivity Relief Toothpaste", "75 g", 'personal/sensodyne-sensitive-75g.jpg'],
  ['personal', "Parachute Coconut Hair Oil", "200 ml", 'personal/parachute-coconut-oil-200ml.jpg'],
  ['personal', "Parachute Coconut Hair Oil", "500 ml", 'personal/parachute-coconut-oil-500ml.jpg'],
  ['personal', "Clinic Plus Shampoo", "175 ml", 'personal/clinic-plus-shampoo-175ml.jpg'],
  ['personal', "Clinic Plus Anti-Dandruff Shampoo", "340 ml", 'personal/head-shoulders-shampoo-180ml.jpg'],
  ['personal', "Head & Shoulders Anti-Dandruff Shampoo", "340 ml", 'personal/head-shoulders-shampoo-180ml.jpg'],
  ['personal', "Sunsilk Shampoo", "180 ml", 'personal/sunsilk-shampoo-180ml.jpg'],
  ['personal', "Dove Shampoo", "180 ml", 'personal/sunsilk-shampoo-180ml.jpg'],
  ['personal', "Gillette Presto Manual Razor", "5 razor pack", 'personal/gillette-presto-razor-5-pack.jpg'],
  ['household', "Surf Excel Top-Load Detergent", "4 kg", 'household/surf-excel-easy-wash-1kg.jpg'],
  ['household', "Ghadi Top-Load Detergent", "1 kg", 'household/surf-excel-easy-wash-1kg.jpg'],
  ['household', "Ariel Top-Load Detergent", "1 kg", 'household/surf-excel-easy-wash-1kg.jpg'],
  ['household', "Surf Excel Matic Detergent Powder", "2 kg", 'household/surf-excel-matic-1kg.jpg'],
  ['household', "Ariel Matic Detergent Powder", "2 kg", 'household/surf-excel-matic-1kg.jpg'],
  ['household', "Tide Matic Detergent Powder", "2 kg", 'household/surf-excel-matic-1kg.jpg'],
  // Batch 4 group G/H: laundry & cleaning, pooja essentials
  ['household', "Tide Plus Top-Load Detergent", "1 kg", 'household/tide-plus-detergent-1kg.jpg'],
  ['household', "Rin Detergent Washing Bar", "4 pack", 'household/rin-detergent-bar-4-pack.jpg'],
  ['household', "Wheel Detergent Washing Bar", "4 pack", 'household/rin-detergent-bar-4-pack.jpg'],
  ['household', "Nirma Detergent Washing Bar", "4 pack", 'household/rin-detergent-bar-4-pack.jpg'],
  ['household', "Comfort Fabric Conditioner", "860 ml", 'household/comfort-fabric-conditioner-860ml.jpg'],
  ['household', "Downy Fabric Conditioner", "860 ml", 'household/comfort-fabric-conditioner-860ml.jpg'],
  ['household', "Colin Glass Cleaner", "500 ml spray", 'household/colin-glass-cleaner-500ml.jpg'],
  ['household', "Cif Glass Cleaner", "500 ml spray", 'household/colin-glass-cleaner-500ml.jpg'],
  ['household', "Harpic Power Plus Toilet Cleaner", "500 ml", 'household/harpic-toilet-cleaner-1l.jpg'],
  ['household', "Odonil Room Freshener", "50 g block", 'household/odonil-air-freshener-50g.jpg'],
  ['household', "Godrej Aer Room Freshener", "50 g block", 'household/odonil-air-freshener-50g.jpg'],
  ['household', "Ambipur Room Freshener", "50 g block", 'household/odonil-air-freshener-50g.jpg'],
  ['pooja', "Homelite Matchbox Bundle", "10 boxes", 'pooja/safety-matchbox-10-pack.jpg'],
  ['pooja', "Ship Matchbox Bundle", "10 boxes", 'pooja/safety-matchbox-10-pack.jpg'],
  ['pooja', "Mangaldeep Agarbatti Incense Sticks", "100 sticks", 'pooja/mangaldeep-agarbatti-ziplock.jpg'],
  ['pooja', "Cycle Agarbatti Incense Sticks", "100 sticks", 'pooja/mangaldeep-agarbatti-ziplock.jpg'],
  ['pooja', "Zed Black Agarbatti Incense Sticks", "100 sticks", 'pooja/mangaldeep-agarbatti-ziplock.jpg'],
  ['pooja', "Cycle Camphor Kapur Tablets", "100 g", 'pooja/camphor-tablets-50g.jpg'],
  ['pooja', "Mangalam Camphor Kapur Tablets", "100 g", 'pooja/camphor-tablets-50g.jpg'],
  ['pooja', "Local Cotton Wicks Batti", "100 pcs", 'pooja/cotton-wicks-100-pack.jpg'],
  ['pooja', "Mangalam Cotton Wicks Batti", "100 pcs", 'pooja/cotton-wicks-100-pack.jpg'],
  // ---- Batch 5: zero-coverage categories -------------------------------------
  // Home & kitchen hardware
  ['homekitchen', "Philips LED Bulb 9W", "1 pc", 'homekitchen/led-bulb-9w.jpg'],
  ['homekitchen', "Syska LED Bulb 9W", "1 pc", 'homekitchen/led-bulb-9w.jpg'],
  ['homekitchen', "Wipro LED Bulb 9W", "1 pc", 'homekitchen/led-bulb-9w.jpg'],
  ['homekitchen', "Philips LED Bulb 12W", "1 pc", 'homekitchen/led-bulb-12w.jpg'],
  ['homekitchen', "Syska LED Bulb 12W", "1 pc", 'homekitchen/led-bulb-12w.jpg'],
  ['homekitchen', "Havells LED Bulb 12W", "1 pc", 'homekitchen/led-bulb-12w.jpg'],
  ['homekitchen', "Duracell AA Batteries", "4 pcs", 'homekitchen/aa-batteries-4-pack.jpg'],
  ['homekitchen', "Eveready AA Batteries", "4 pcs", 'homekitchen/aa-batteries-4-pack.jpg'],
  ['homekitchen', "Panasonic AA Batteries", "4 pcs", 'homekitchen/aa-batteries-4-pack.jpg'],
  ['homekitchen', "Local Gas Lighter", "1 pc", 'homekitchen/gas-lighter.jpg'],
  ['homekitchen', "Pigeon Gas Lighter", "1 pc", 'homekitchen/gas-lighter.jpg'],
  ['homekitchen', "Cello Plastic Bucket", "20 L", 'homekitchen/plastic-bucket-20l.jpg'],
  ['homekitchen', "Nayasa Plastic Bucket", "20 L", 'homekitchen/plastic-bucket-20l.jpg'],
  ['homekitchen', "Local Steel Scrubber", "3 pcs", 'homekitchen/steel-scrubber-3-pack.jpg'],
  ['homekitchen', "Scotch-Brite Steel Scrubber", "3 pcs", 'homekitchen/steel-scrubber-3-pack.jpg'],
  ['homekitchen', "Hawkins Pressure Cooker", "3 L", 'homekitchen/pressure-cooker-3l.jpg'],
  ['homekitchen', "Prestige Pressure Cooker", "3 L", 'homekitchen/pressure-cooker-3l.jpg'],
  ['homekitchen', "Hawkins Non-Stick Tawa", "25 cm", 'homekitchen/non-stick-tawa-25cm.jpg'],
  ['homekitchen', "Pigeon Non-Stick Tawa", "25 cm", 'homekitchen/non-stick-tawa-25cm.jpg'],
  ['homekitchen', "Prestige Non-Stick Tawa", "25 cm", 'homekitchen/non-stick-tawa-25cm.jpg'],
  ['homekitchen', "Cello Steel Tiffin Box", "3 container", 'homekitchen/steel-tiffin-box-3-tier.jpg'],
  ['homekitchen', "Milton Steel Tiffin Box", "3 container", 'homekitchen/steel-tiffin-box-3-tier.jpg'],
  ['homekitchen', "Local Kitchen Knife", "1 pc", 'homekitchen/kitchen-knife.jpg'],
  ['homekitchen', "Pigeon Kitchen Knife", "1 pc", 'homekitchen/kitchen-knife.jpg'],
  // ---- Batch 5: fresh meat, fish & poultry -----------------------------------
  ['meat', "Fresh Farm Chicken Curry Cut", "500 g", 'meat/chicken-curry-cut-500g.jpg'],
  ['meat', "Fresh Farm Chicken Curry Cut", "1 kg", 'meat/chicken-curry-cut-500g.jpg'],
  ['meat', "Licious Chicken Curry Cut", "500 g", 'meat/chicken-curry-cut-500g.jpg'],
  ['meat', "Licious Chicken Curry Cut", "1 kg", 'meat/chicken-curry-cut-500g.jpg'],
  ['meat', "Local Chicken Curry Cut", "500 g", 'meat/chicken-curry-cut-500g.jpg'],
  ['meat', "Local Chicken Curry Cut", "1 kg", 'meat/chicken-curry-cut-500g.jpg'],
  ['meat', "Fresh Farm Chicken Breast Boneless", "450 g", 'meat/chicken-breast-boneless-450g.jpg'],
  ['meat', "Fresh Farm Chicken Breast Boneless", "1 kg", 'meat/chicken-breast-boneless-450g.jpg'],
  ['meat', "Licious Chicken Breast Boneless", "450 g", 'meat/chicken-breast-boneless-450g.jpg'],
  ['meat', "Licious Chicken Breast Boneless", "1 kg", 'meat/chicken-breast-boneless-450g.jpg'],
  ['meat', "Licious Chicken Drumstick", "500 g", 'meat/chicken-drumstick-500g.jpg'],
  ['meat', "Local Chicken Drumstick", "500 g", 'meat/chicken-drumstick-500g.jpg'],
  ['meat', "Fresh Farm Chicken Keema Mince", "450 g", 'meat/chicken-keema-mince-450g.jpg'],
  ['meat', "Licious Chicken Keema Mince", "450 g", 'meat/chicken-keema-mince-450g.jpg'],
  ['meat', "Fresh Farm Whole Chicken Skinless", "1 kg", 'meat/whole-chicken-skinless-1kg.jpg'],
  ['meat', "Fresh Farm Whole Chicken Skinless", "1.5 kg", 'meat/whole-chicken-skinless-1kg.jpg'],
  ['meat', "Local Whole Chicken Skinless", "1 kg", 'meat/whole-chicken-skinless-1kg.jpg'],
  ['meat', "Local Whole Chicken Skinless", "1.5 kg", 'meat/whole-chicken-skinless-1kg.jpg'],
  ['meat', "Licious Mutton Curry Cut", "500 g", 'meat/mutton-curry-cut-500g.jpg'],
  ['meat', "Licious Mutton Curry Cut", "1 kg", 'meat/mutton-curry-cut-500g.jpg'],
  ['meat', "Local Mutton Curry Cut", "500 g", 'meat/mutton-curry-cut-500g.jpg'],
  ['meat', "Local Mutton Curry Cut", "1 kg", 'meat/mutton-curry-cut-500g.jpg'],
  ['meat', "Licious Mutton Keema", "450 g", 'meat/mutton-keema-450g.jpg'],
  ['meat', "Local Mutton Keema", "450 g", 'meat/mutton-keema-450g.jpg'],
  ['meat', "Fresh Catch Rohu Fish Cut", "500 g", 'meat/rohu-fish-cut-500g.jpg'],
  ['meat', "Fresh Catch Rohu Fish Cut", "1 kg", 'meat/rohu-fish-cut-500g.jpg'],
  ['meat', "Local Catch Rohu Fish Cut", "500 g", 'meat/rohu-fish-cut-500g.jpg'],
  ['meat', "Local Catch Rohu Fish Cut", "1 kg", 'meat/rohu-fish-cut-500g.jpg'],
  ['meat', "Fresh Catch Rui Machh Steaks", "500 g", 'meat/rohu-fish-cut-500g.jpg'],
  ['meat', "Fresh Catch Katla Fish Cut", "500 g", 'meat/katla-fish-cut-500g.jpg'],
  ['meat', "Fresh Catch Katla Fish Cut", "1 kg", 'meat/katla-fish-cut-500g.jpg'],
  ['meat', "Local Catch Katla Fish Cut", "500 g", 'meat/katla-fish-cut-500g.jpg'],
  ['meat', "Local Catch Katla Fish Cut", "1 kg", 'meat/katla-fish-cut-500g.jpg'],
  ['meat', "Fresh Catch Prawns Cleaned", "250 g", 'meat/prawns-cleaned-250g.jpg'],
  ['meat', "Fresh Catch Prawns Cleaned", "500 g", 'meat/prawns-cleaned-250g.jpg'],
  ['meat', "Licious Prawns Cleaned", "250 g", 'meat/prawns-cleaned-250g.jpg'],
  ['meat', "Licious Prawns Cleaned", "500 g", 'meat/prawns-cleaned-250g.jpg'],
  // Batch 5: meat completion + munchies deepening
  ['meat', "Fresh Catch Basa Fish Fillet", "500 g", 'meat/basa-fish-fillet-500g.jpg'],
  ['meat', "Licious Basa Fish Fillet", "500 g", 'meat/basa-fish-fillet-500g.jpg'],
  ['meat', "Fresh Catch Pomfret Whole", "500 g", 'meat/pomfret-whole-500g.jpg'],
  ['meat', "Godrej Yummiez Chicken Salami", "200 g", 'meat/chicken-salami-200g.jpg'],
  ['meat', "Venky\u2019s Chicken Salami", "200 g", 'meat/chicken-salami-200g.jpg'],
  ['meat', "Godrej Yummiez Chicken Sausages", "250 g", 'meat/chicken-sausages-250g.jpg'],
  ['meat', "Godrej Yummiez Chicken Sausages", "500 g", 'meat/chicken-sausages-250g.jpg'],
  ['meat', "Venky\u2019s Chicken Sausages", "250 g", 'meat/chicken-sausages-250g.jpg'],
  ['meat', "Venky\u2019s Chicken Sausages", "500 g", 'meat/chicken-sausages-250g.jpg'],
  ['meat', "Local Farm Country Eggs Desi", "6 pcs", 'meat/country-eggs-desi-6pcs.jpg'],
  ['meat', "Local Farm Country Eggs Desi", "12 pcs", 'meat/country-eggs-desi-6pcs.jpg'],
  ['meat', "Local Fish Curry Masala Kit", "100 g", 'meat/fish-curry-masala-kit-100g.jpg'],
  ['meat', "MDH Fish Curry Masala Kit", "100 g", 'meat/fish-curry-masala-kit-100g.jpg'],
  ['munchies', "Lay\u2019s Classic Salted Chips", "52 g", 'munchies/classic-salted-chips-52g.jpg'],
  ['munchies', "Uncle Chipps Classic Salted Chips", "52 g", 'munchies/classic-salted-chips-52g.jpg'],
  ['munchies', "Lay\u2019s Classic Salted Chips", "157 g party", 'munchies/masala-chips-157g-party.jpg'],
  ['munchies', "Lay\u2019s Magic Masala Chips", "157 g party", 'munchies/masala-chips-157g-party.jpg'],
  ['munchies', "Uncle Chipps Classic Salted Chips", "157 g party", 'munchies/masala-chips-157g-party.jpg'],
  ['munchies', "Ruffles Magic Masala Chips", "157 g party", 'munchies/masala-chips-157g-party.jpg'],
  ['munchies', "Haldiram\u2019s Potato Wafers Salted", "150 g", 'munchies/potato-wafers-salted-150g.jpg'],
  ['munchies', "Uncle Chipps Potato Wafers Salted", "150 g", 'munchies/potato-wafers-salted-150g.jpg'],
  ['munchies', "Act II Salted Popcorn", "150 g", 'munchies/salted-popcorn-150g.jpg'],
  ['munchies', "Haldiram\u2019s Salted Popcorn", "150 g", 'munchies/salted-popcorn-150g.jpg'],
  // Batch 5: namkeen & dry fruits deepening
  ['munchies', "Bikharam Bhujiya Sev", "200 g", 'munchies/bhujiya-sev-200g.jpg'],
  ['munchies', "Haldiram\u2019s Bhujiya Sev", "200 g", 'munchies/bhujiya-sev-200g.jpg'],
  ['munchies', "Bikaji Navratan Mixture", "200 g", 'munchies/navratan-mixture-200g.jpg'],
  ['munchies', "Haldiram\u2019s Navratan Mixture", "200 g", 'munchies/navratan-mixture-200g.jpg'],
  ['munchies', "Bikaji Moong Dal", "200 g", 'munchies/moong-dal-namkeen-200g.jpg'],
  ['munchies', "Haldiram\u2019s Moong Dal", "200 g", 'munchies/moong-dal-namkeen-200g.jpg'],
  ['munchies', "Haldiram\u2019s Khatta Meetha Namkeen", "200 g", 'munchies/khatta-meetha-namkeen-200g.jpg'],
  ['munchies', "Cornitos Nacho Tortilla Chips", "100 g", 'munchies/nacho-tortilla-chips-100g.jpg'],
  ['munchies', "Doritos Nacho Tortilla Chips", "100 g", 'munchies/nacho-tortilla-chips-100g.jpg'],
  ['munchies', "Haldiram\u2019s Roasted Peanuts", "200 g", 'munchies/roasted-peanuts-200g.jpg'],
  ['munchies', "Jabsons Roasted Peanuts", "200 g", 'munchies/roasted-peanuts-200g.jpg'],
  ['dryfruits', "Happilo Dates Khajur Seedless", "500 g", 'dryfruits/dates-khajur-seedless-500g.jpg'],
  ['dryfruits', "Lion Dates Khajur Seedless", "500 g", 'dryfruits/dates-khajur-seedless-500g.jpg'],
  ['dryfruits', "Vedaka Dates Khajur Seedless", "500 g", 'dryfruits/dates-khajur-seedless-500g.jpg'],
  ['dryfruits', "Happilo Anjeer Dried Figs", "200 g", 'dryfruits/anjeer-dried-figs-200g.jpg'],
  ['dryfruits', "Nutraj Anjeer Dried Figs", "200 g", 'dryfruits/anjeer-dried-figs-200g.jpg'],
  ['dryfruits', "Happilo Walnut Kernels", "200 g", 'dryfruits/walnut-kernels-200g.jpg'],
  ['dryfruits', "Nutraj Walnut Kernels", "200 g", 'dryfruits/walnut-kernels-200g.jpg'],
  ['dryfruits', "Happilo Pistachio Roasted Salted", "200 g", 'dryfruits/pistachio-roasted-salted-200g.jpg'],
  ['dryfruits', "Nutraj Pistachio Roasted Salted", "200 g", 'dryfruits/pistachio-roasted-salted-200g.jpg'],
  // Batch 5: chocolates, confectionery, frozen desserts & sweets
  ['chocolates', "KitKat Crispy Wafer Chocolate", "37.3 g", 'chocolates/crispy-wafer-chocolate-100g.jpg'],
  ['chocolates', "Nestle KitKat Crispy Wafer Chocolate", "37.3 g", 'chocolates/crispy-wafer-chocolate-100g.jpg'],
  ['chocolates', "Mars Candy Bar Multipack", "12 pack box", 'chocolates/candy-bar-multipack-10.jpg'],
  ['chocolates', "Snickers Candy Bar Multipack", "12 pack box", 'chocolates/candy-bar-multipack-10.jpg'],
  ['chocolates', "Bounty Candy Bar Multipack", "12 pack box", 'chocolates/candy-bar-multipack-10.jpg'],
  ['chocolates', "5 Star Caramel Chocolate Bar", "40 g", 'chocolates/caramel-chocolate-bar-50g.jpg'],
  ['chocolates', "Cadbury Fuse Caramel Chocolate Bar", "40 g", 'chocolates/caramel-chocolate-bar-50g.jpg'],
  ['chocolates', "Cadbury Gems Sugar Buttons", "100 g pack", 'chocolates/gems-sugar-buttons-100g.jpg'],
  ['chocolates', "Ferrero Rocher Premium Hazelnut Box", "16 pcs box", 'chocolates/premium-hazelnut-box-16pcs.jpg'],
  ['chocolates', "Ferrero Mon Ch\u00e9ri Premium Hazelnut Box", "16 pcs box", 'chocolates/premium-hazelnut-box-16pcs.jpg'],
  ['chocolates', "Nutella Hazelnut Spread", "350 g", 'chocolates/hazelnut-spread-350g.jpg'],
  ['chocolates', "Jus\u2019 Amazin Hazelnut Spread", "350 g", 'chocolates/hazelnut-spread-350g.jpg'],
  ['chocolates', "Cadbury Chocolate Syrup", "200 ml", 'chocolates/chocolate-syrup-200ml.jpg'],
  ['chocolates', "Hershey\u2019s Chocolate Syrup", "200 ml", 'chocolates/chocolate-syrup-200ml.jpg'],
  ['chocolates', "Amul Ice Cream Tub", "700 ml tub", 'chocolates/ice-cream-tub-700ml.jpg'],
  ['chocolates', "Kwality Walls Ice Cream Tub", "700 ml tub", 'chocolates/ice-cream-tub-700ml.jpg'],
  ['chocolates', "Mother Dairy Ice Cream Tub", "700 ml tub", 'chocolates/ice-cream-tub-700ml.jpg'],
  ['chocolates', "Amul Choco Bar Ice Cream", "single", 'chocolates/choco-bar-ice-cream-60ml.jpg'],
  ['chocolates', "Kwality Walls Choco Bar Ice Cream", "single", 'chocolates/choco-bar-ice-cream-60ml.jpg'],
  ['chocolates', "Haldiram\u2019s Rasmalai Tin", "1 kg tin", 'chocolates/rasmalai-tin-1kg.jpg'],
  ['chocolates', "MTR Rasmalai Tin", "1 kg tin", 'chocolates/rasmalai-tin-1kg.jpg'],
];

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

// Resolve identity rows -> { skuId: assetSlug } against the master catalog.
const SKU_ASSETS = {};
{
  const byIdentity = new Map();
  if (catalog) {
    for (const p of catalog.values()) {
      byIdentity.set(`${p.categoryId}::${p.name}::${p.unit}`, p.id);
    }
  }
  for (const [categoryId, name, unit, slug] of SKU_ASSET_ROWS) {
    if (!catalog) { continue; }
    const id = byIdentity.get(`${categoryId}::${name}::${unit}`);
    if (!id) {
      errors.push(`no catalog SKU for [${categoryId}] ${name} · ${unit} (asset ${slug})`);
      continue;
    }
    if (SKU_ASSETS[id]) {
      errors.push(`${id} (${name} · ${unit}) mapped twice`);
      continue;
    }
    SKU_ASSETS[id] = slug;
  }
}

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
      if (!SKU_ASSET_ROWS.some((r) => r[3] === rel)) orphans.push(rel);
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
  totalAssets: new Set(SKU_ASSET_ROWS.map((r) => r[3])).size,
  totalSkus: Object.keys(entries).length,
  items: entries,
};

fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');

console.log(`Verified ${manifest.totalAssets} pack shots -> ${manifest.totalSkus} SKUs`);
console.log(`Wrote ${path.relative(process.cwd(), MANIFEST)}`);
if (orphans.length) console.log(`  note: ${orphans.length} unmapped asset(s): ${orphans.join(', ')}`);

module.exports = { SKU_ASSET_ROWS, MANIFEST };
