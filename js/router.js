/* BazaarSetu — Hash-based SPA Router */
/* Reads window.location.hash and toggles .screen visibility */

(function () {
  'use strict';

  function getHash() {
    return (window.location.hash || '#').slice(1);
  }

  function showScreen(screenId) {
    var screens = document.querySelectorAll('.screen');
    var found = false;
    screens.forEach(function (s) {
      if (s.id === screenId) {
        s.classList.add('active');
        found = true;
      } else {
        s.classList.remove('active');
      }
    });
    if (!found && screens.length > 0) {
      screens[0].classList.add('active');
    }
    updateNav(screenId);
    window.scrollTo(0, 0);
  }

  function updateNav(screenId) {
    document.querySelectorAll('.bottom-nav .nav-item').forEach(function (item) {
      var href = item.getAttribute('href') || '';
      var target = href.replace('#', '');
      if (target === screenId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function onHashChange() {
    var id = getHash();
    if (!id) {
      var first = document.querySelector('.screen');
      if (first) {
        window.location.hash = '#' + first.id;
      }
      return;
    }
    showScreen(id);
  }

  // Public API
  window.BazaarSetuRouter = {
    navigate: function (screenId) {
      window.location.hash = '#' + screenId;
    },
    current: getHash,
    refresh: onHashChange
  };

  // Initialize
  window.addEventListener('hashchange', onHashChange);
  window.addEventListener('DOMContentLoaded', function () {
    // If no hash, go to first screen
    if (!getHash()) {
      var first = document.querySelector('.screen');
      if (first) {
        window.location.hash = '#' + first.id;
        return;
      }
    }
    onHashChange();
  });
})();
