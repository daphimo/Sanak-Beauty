(() => {
  if (window.sanakProductCardsBooted) return;
  window.sanakProductCardsBooted = true;

  const prepare = (scope = document) => {
    scope.querySelectorAll('[data-product-card]').forEach((card) => {
      if (card.dataset.productCardReady === 'true') return;
      card.dataset.productCardReady = 'true';
      const slot = card.querySelector('[data-card-quick-add-slot]');
      const quickAdd = card.querySelector('.card > .card__content .quick-add');
      if (slot && quickAdd) {
        const modal = quickAdd.querySelector('.quick-add-modal');
        if (modal) card.appendChild(modal);
        slot.appendChild(quickAdd);
      }
    });
  };

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-wishlist-toggle], .quick-add, .sanak-product-card__dots, [data-auto-gallery]')) {
      event.stopPropagation();
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => prepare());
  else prepare();

  document.addEventListener('shopify:section:load', (event) => prepare(event.target));
})();
