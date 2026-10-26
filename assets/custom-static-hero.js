(() => {
  if (window.customStaticHeroBooted) return;
  window.customStaticHeroBooted = true;

  const observers = new WeakMap();

  const initialize = (root) => {
    if (observers.has(root)) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      root.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          root.classList.add('is-visible');
          observer.unobserve(root);
        });
      },
      { threshold: 0.18 }
    );

    observers.set(root, observer);
    root.classList.add('is-animation-ready');
    observer.observe(root);
  };

  const setup = (scope = document) => {
    scope.querySelectorAll('[data-custom-static-hero]').forEach(initialize);
  };

  const teardown = (scope) => {
    scope.querySelectorAll('[data-custom-static-hero]').forEach((root) => {
      const observer = observers.get(root);
      if (observer) observer.disconnect();
      observers.delete(root);
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup());
  else setup();

  document.addEventListener('shopify:section:load', (event) => setup(event.target));
  document.addEventListener('shopify:section:unload', (event) => teardown(event.target));
})();
