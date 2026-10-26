(() => {
  const selector = '[data-sanak-footer]';
  const mobile = window.matchMedia('(max-width: 749px)');
  const instances = new WeakMap();

  const initialize = (root) => {
    if (instances.has(root)) return;
    root.dataset.footerReady = 'true';
    const controller = new AbortController();
    const { signal } = controller;

    const update = () => {
      const collapsible = mobile.matches ? root.dataset.collapseMobile === 'true' : root.dataset.collapseDesktop === 'true';
      root.querySelectorAll('[data-footer-trigger]').forEach((trigger) => {
        const panel = root.querySelector(`#${CSS.escape(trigger.getAttribute('aria-controls'))}`);
        trigger.disabled = !collapsible;
        trigger.setAttribute('aria-expanded', String(!collapsible));
        if (panel) panel.hidden = collapsible;
      });
    };

    root.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-footer-trigger]');
      if (!trigger || trigger.disabled) return;
      const panel = root.querySelector(`#${CSS.escape(trigger.getAttribute('aria-controls'))}`);
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      trigger.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
    }, { signal });

    mobile.addEventListener('change', update);
    update();
    instances.set(root, { controller, update });
  };

  const setup = (scope = document) => scope.querySelectorAll(selector).forEach(initialize);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup(), { once: true });
  else setup();
  document.addEventListener('shopify:section:load', (event) => setup(event.target));
  document.addEventListener('shopify:section:unload', (event) => {
    event.target.querySelectorAll(selector).forEach((root) => {
      const instance = instances.get(root);
      if (!instance) return;
      mobile.removeEventListener('change', instance.update);
      instance.controller.abort();
      instances.delete(root);
    });
  });
})();
