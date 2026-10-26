(() => {
  const key = 'sanak:wishlist:v1';
  const read = () => {
    try {
      const items = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(items) ? [...new Set(items.filter((item) => typeof item === 'string' && item))] : [];
    } catch {
      return [];
    }
  };
  const write = (items) => {
    try {
      localStorage.setItem(key, JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('sanak:wishlist-change', { detail: items }));
      return true;
    } catch {
      return false;
    }
  };
  const sync = () => {
    const items = read();
    document.querySelectorAll('[data-wishlist-toggle]').forEach((button) => {
      const active = items.includes(button.dataset.productHandle);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-label', `${active ? 'Remove' : 'Add'} ${button.dataset.productTitle || 'product'} ${active ? 'from' : 'to'} wishlist`);
    });
    document.querySelectorAll('[data-wishlist-count]').forEach((node) => { node.textContent = items.length; node.dataset.count = items.length; });
  };
  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-wishlist-toggle]');
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (button.disabled || button.getAttribute('aria-disabled') === 'true') return;
    const items = read();
    const handle = button.dataset.productHandle;
    if (!handle) return;
    write(items.includes(handle) ? items.filter((item) => item !== handle) : [...items, handle]);
  });
  window.addEventListener('sanak:wishlist-change', sync);
  window.addEventListener('storage', sync);
  const observe = () => {
    const nodes = document.querySelectorAll('.shopify-section:not(.shopify-section-group-header-group):not(.shopify-section-group-footer-group)');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return nodes.forEach((node) => node.classList.add('is-visible'));
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { threshold: .08, rootMargin: '0px 0px -6% 0px' });
    nodes.forEach((node) => { node.classList.add('sanak-reveal'); observer.observe(node); });
  };
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || link.target || event.metaKey || event.ctrlKey || event.shiftKey || link.hasAttribute('download') || link.dataset.familyProduct != null) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.pathname === location.pathname && destination.search === location.search) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    event.preventDefault();
    document.querySelector('[data-page-transition]')?.classList.add('is-leaving');
    setTimeout(() => { location.href = destination.href; }, 480);
  });
  document.addEventListener('DOMContentLoaded', () => { sync(); observe(); });
  document.addEventListener('shopify:section:load', () => { sync(); observe(); });
})();
