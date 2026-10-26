(() => {
  if (window.sanakProductCardsBooted) return;
  window.sanakProductCardsBooted = true;

  const timers = new WeakMap();
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const showImage = (card, index) => {
    const images = [...card.querySelectorAll('[data-card-gallery-image]')];
    if (!images.length) return;
    const nextIndex = index % images.length;
    images.forEach((image, imageIndex) => image.classList.toggle('is-active', imageIndex === nextIndex));
    card.querySelectorAll('[data-gallery-dot]').forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === nextIndex);
    });
    card.dataset.galleryIndex = String(nextIndex);
  };

  const stopGallery = (card) => {
    const timer = timers.get(card);
    if (timer) window.clearInterval(timer);
    timers.delete(card);
    showImage(card, 0);
  };

  const startGallery = (card) => {
    if (card.dataset.galleryMode !== 'auto' || !finePointer.matches || reducedMotion.matches) return;
    const images = card.querySelectorAll('[data-card-gallery-image]');
    if (images.length < 2 || timers.has(card)) return;
    const interval = Math.max(1000, Number(card.dataset.galleryInterval) || 3000);
    timers.set(
      card,
      window.setInterval(() => showImage(card, (Number(card.dataset.galleryIndex) || 0) + 1), interval),
    );
  };

  const prepare = (scope = document) => {
    scope.querySelectorAll('[data-product-card]').forEach((card) => {
      if (card.dataset.productCardReady === 'true') return;
      card.dataset.productCardReady = 'true';
      card.dataset.galleryIndex = '0';
      const slot = card.querySelector('[data-card-quick-add-slot]');
      const quickAdd = card.querySelector('.card > .card__content .quick-add');
      if (slot && quickAdd) {
        const modal = quickAdd.querySelector('.quick-add-modal');
        if (modal) card.appendChild(modal);
        slot.appendChild(quickAdd);
      }
    });
  };

  document.addEventListener('pointerover', (event) => {
    const card = event.target.closest('[data-product-card]');
    if (!card || card.contains(event.relatedTarget)) return;
    startGallery(card);
  });

  document.addEventListener('pointerout', (event) => {
    const card = event.target.closest('[data-product-card]');
    if (!card || card.contains(event.relatedTarget)) return;
    stopGallery(card);
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-wishlist-toggle], .quick-add, .sanak-product-card__dots')) {
      event.stopPropagation();
    }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => prepare());
  else prepare();

  document.addEventListener('shopify:section:load', (event) => prepare(event.target));
  document.addEventListener('shopify:section:unload', (event) => {
    event.target.querySelectorAll('[data-product-card]').forEach(stopGallery);
  });
})();
