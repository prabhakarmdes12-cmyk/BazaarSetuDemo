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
  ['biscuits', "Parle-G Gold Glucose Biscuits", "250 g", 'biscuits/glucose-biscuits-250g.jpg'],
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
