/* BazaarSetu — Shared Components */
/* Provides renderTopBar() and renderBottomNav() functions */

var BS = window.BazaarSetuComponents = {};

BS.renderTopBar = function (opts) {
  opts = opts || {};
  var showBack = opts.back !== undefined ? opts.back : false;
  var title = opts.title || 'BazaarSetu';
  var showNotifications = opts.notifications !== undefined ? opts.notifications : true;
  var showBrand = opts.brand !== undefined ? opts.brand : true;
  var backTarget = opts.backTarget || '';

  var leftPart = '';
  if (showBack) {
    leftPart = '<a href="' + backTarget + '" class="back-btn mr-2"><span class="material-symbols-outlined">arrow_back</span></a>';
  }
  if (showBrand) {
    leftPart += '<div class="flex flex-col">' +
      '<span class="brand-text">BazaarSetu</span>' +
      '<span class="brand-tagline">\'Apni local dukaan, ab online\'</span>' +
      '</div>';
  } else {
    leftPart += '<span class="font-headline font-bold text-xl text-on-surface">' + title + '</span>';
  }

  var rightPart = '';
  if (showNotifications) {
    rightPart = '<button class="p-2 rounded-full hover:bg-orange-50 transition-colors text-orange-600 active:scale-95 transition-transform duration-200">' +
      '<span class="material-symbols-outlined">notifications</span>' +
      '</button>';
  }

  return '<header class="top-bar">' +
    '<div class="bar-inner">' +
    '<div class="flex items-center gap-3">' + leftPart + '</div>' +
    '<div class="flex items-center gap-3">' + rightPart + '</div>' +
    '</div>' +
    '</header>';
};

BS.renderBottomNav = function (role, activeId) {
  var configs = {
    customer: [
      { id: 'home', icon: 'home', label: 'Discovery' },
      { id: 'order-history', icon: 'shopping_bag', label: 'Orders' },
      { id: 'shop-chat', icon: 'chat', label: 'Chat' },
      { id: 'profile', icon: 'person', label: 'Profile' }
    ],
    vendor: [
      { id: 'dashboard', icon: 'dashboard', label: 'Home' },
      { id: 'orders', icon: 'package_2', label: 'Orders' },
      { id: 'stats', icon: 'analytics', label: 'Stats' },
      { id: 'chat-list', icon: 'chat_bubble', label: 'Chats' }
    ],
    admin: [
      { id: 'overview', icon: 'dashboard', label: 'Overview' },
      { id: 'shops', icon: 'store', label: 'Shops' },
      { id: 'orders', icon: 'list_alt', label: 'Orders' },
      { id: 'settings', icon: 'settings', label: 'Settings' }
    ],
    udhaar: [
      { id: 'home', icon: 'home', label: 'Home' },
      { id: 'ledger', icon: 'account_balance_wallet', label: 'Udhaar' },
      { id: 'order-history', icon: 'receipt_long', label: 'Orders' },
      { id: 'profile', icon: 'person', label: 'Profile' }
    ]
  };

  var items = configs[role] || configs.customer;
  var html = '<nav class="bottom-nav"><div class="nav-inner">';
  items.forEach(function (item) {
    var isActive = item.id === activeId;
    html += '<a href="#' + item.id + '" class="nav-item' + (isActive ? ' active' : '') + '">' +
      '<span class="material-symbols-outlined"' + (isActive ? ' style="font-variation-settings: \'FILL\' 1;"' : '') + '>' + item.icon + '</span>' +
      '<span class="nav-label">' + item.label + '</span>' +
      '</a>';
  });
  html += '</div></nav>';
  return html;
};

BS.renderFAB = function (icon, targetHash) {
  icon = icon || 'shopping_cart';
  return '<a href="#' + (targetHash || 'cart') + '" class="fab">' +
    '<span class="material-symbols-outlined">' + icon + '</span>' +
    '</a>';
};
