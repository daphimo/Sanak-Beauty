(() => {
  if (window.splitImageContentSliderBooted) return;
  window.splitImageContentSliderBooted = true;

  const instances = new WeakMap();
  const fadeTimers = new WeakMap();
  let splidePromise;

  const loadSplide = (root) => {
    if (window.Splide) return Promise.resolve();
    if (splidePromise) return splidePromise;
    splidePromise = new Promise((resolve, reject) => {
      const cssUrl = root.dataset.splideCss;
      if (!document.querySelector(`link[href="${cssUrl}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssUrl;
        document.head.appendChild(link);
      }
      const existing = document.querySelector(`script[src="${root.dataset.splideJs}"]`);
      if (existing) {
        if (window.Splide) resolve();
        else {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
        }
        return;
      }
      const script = document.createElement('script');
      script.src = root.dataset.splideJs;
      script.addEventListener('load', resolve, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
    return splidePromise;
  };

  const activateContent = (root, index) => {
    window.clearTimeout(fadeTimers.get(root));
    const items = root.querySelectorAll('[data-content-index]');
    items.forEach((item) => {
      const active = Number(item.dataset.contentIndex) === index;
      if (active) item.hidden = false;
      item.classList.toggle('is-active', active);
      item.toggleAttribute('inert', !active);
      item.setAttribute('aria-hidden', String(!active));
    });
    const timer = window.setTimeout(() => {
      items.forEach((item) => {
        item.hidden = Number(item.dataset.contentIndex) !== index;
      });
    }, 430);
    fadeTimers.set(root, timer);
  };

  const mount = async (root) => {
    if (instances.has(root)) return;
    const visual = root.querySelector('[data-split-slider-visual]');
    const count = visual?.querySelectorAll('.split-slider__slide').length || 0;
    if (!visual || count < 2) {
      activateContent(root, 0);
      return;
    }
    try {
      await loadSplide(root);
    } catch (error) {
      console.error('Split image slider could not load Splide.', error);
      return;
    }
    if (!root.isConnected || instances.has(root) || !window.Splide) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const instance = new window.Splide(visual, {
      type: root.dataset.behavior === 'loop' ? 'loop' : 'slide',
      rewind: root.dataset.behavior === 'rewind',
      perPage: 1,
      perMove: 1,
      speed: reducedMotion ? 0 : Number(root.dataset.speed),
      autoplay: root.dataset.autoplay === 'true' && !reducedMotion,
      interval: Number(root.dataset.interval),
      pauseOnHover: true,
      pauseOnFocus: true,
      arrows: root.dataset.arrows === 'true',
      pagination: root.dataset.pagination === 'true',
      drag: true,
      keyboard: 'focused',
      live: true,
      reducedMotion: { speed: 0, rewindSpeed: 0, autoplay: 'pause' },
    });
    instance.on('move', (newIndex) => activateContent(root, newIndex));
    instance.on('mounted', () => activateContent(root, instance.index));
    instance.mount();
    instances.set(root, instance);
  };

  const destroy = (root) => {
    window.clearTimeout(fadeTimers.get(root));
    const instance = instances.get(root);
    if (instance) instance.destroy(true);
    instances.delete(root);
  };

  const setup = (scope = document) => scope.querySelectorAll('[data-split-slider]').forEach(mount);
  const teardown = (scope) => scope.querySelectorAll('[data-split-slider]').forEach(destroy);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup());
  else setup();
  document.addEventListener('shopify:section:load', (event) => setup(event.target));
  document.addEventListener('shopify:section:unload', (event) => teardown(event.target));
  document.addEventListener('shopify:block:select', (event) => {
    const root = event.target.closest('[data-split-slider]');
    const slide = event.target.closest('[data-slide-index]');
    const instance = root && instances.get(root);
    if (instance && slide) instance.go(Number(slide.dataset.slideIndex));
  });
})();
