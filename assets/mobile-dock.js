(() => {
  const initialize = (dock) => {
    if (dock.dataset.ready === 'true') return;
    dock.dataset.ready = 'true';
    const syncCartCount = () => {
      const count = document.querySelector('#cart-icon-bubble .cart-count-bubble span[aria-hidden="true"]')?.textContent?.trim() || '';
      let badge = dock.querySelector('[data-dock-cart] .sanak-mobile-dock__count');
      if (!badge && count) {
        badge = document.createElement('span');
        badge.className = 'sanak-mobile-dock__count';
        dock.querySelector('[data-dock-cart] .sanak-mobile-dock__icon')?.append(badge);
      }
      if (badge) badge.textContent = count;
    };
    const headerCart = document.querySelector('#cart-icon-bubble');
    if (headerCart) new MutationObserver(syncCartCount).observe(headerCart, { childList: true, subtree: true, characterData: true });
    syncCartCount();
    dock.addEventListener('click', (event) => {
      const menuButton = event.target.closest('[data-dock-menu]');
      if (menuButton) {
        document.querySelector('header-drawer > details > summary')?.click();
        return;
      }
      const cartButton = event.target.closest('[data-dock-cart]');
      if (cartButton) {
        const drawer = document.querySelector('cart-drawer');
        if (drawer?.open) drawer.open(cartButton);
        else window.location.assign(window.routes?.cart_url || '/cart');
        return;
      }
      if (event.target.closest('[data-dock-videos]')) {
        const videoButton = document.querySelector('[data-ugc-open]:not([disabled])');
        if (videoButton) videoButton.click();
        else {
          const videosSection = document.querySelector('[data-sanak-ugc]');
          if (videosSection) videosSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else event.target.closest('[data-dock-videos]').setAttribute('aria-disabled', 'true');
        }
      }
    });
  };
  const setup = (scope = document) => scope.querySelectorAll('[data-mobile-dock]').forEach(initialize);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup(), { once: true });
  else setup();
  document.addEventListener('shopify:section:load', (event) => setup(event.target));
})();
