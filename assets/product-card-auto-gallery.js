(() => {
  if (window.sanakAutoGalleriesBooted) return;
  window.sanakAutoGalleriesBooted = true;

  const instances = new WeakMap();
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let splidePromise;

  const findAsset = (selector, url) => {
    const absoluteUrl = new URL(url, document.baseURI).href;
    return [...document.querySelectorAll(selector)].find(
      (asset) => asset.src === absoluteUrl || asset.href === absoluteUrl,
    );
  };

  const loadSplide = (root) => {
    if (window.Splide) return Promise.resolve();
    if (splidePromise) return splidePromise;

    splidePromise = new Promise((resolve, reject) => {
      const cssUrl = root.dataset.splideCss;
      const jsUrl = root.dataset.splideJs;
      let stylesheet = findAsset('link[rel="stylesheet"]', cssUrl);

      if (!stylesheet) {
        stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = cssUrl;
        stylesheet.dataset.sanakCardGalleryAsset = 'splide-css';
        document.head.appendChild(stylesheet);
      }

      const finish = () => {
        if (window.Splide) resolve();
        else reject(new Error('Splide loaded without exposing window.Splide.'));
      };

      const existingScript = findAsset('script[src]', jsUrl);
      if (existingScript) {
        if (window.Splide) resolve();
        else existingScript.addEventListener('load', finish, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = jsUrl;
      script.defer = true;
      script.dataset.sanakCardGalleryAsset = 'splide-js';
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });

    return splidePromise;
  };

  const mount = async (root) => {
    if (instances.has(root) || root.querySelectorAll('[data-auto-gallery-slide]').length < 2) return;

    try {
      await loadSplide(root);
    } catch (error) {
      console.error('Product card gallery could not load Splide.', error);
      return;
    }

    if (!root.isConnected || instances.has(root) || !window.Splide) return;

    const instance = new window.Splide(root, {
      type: 'loop',
      perPage: 1,
      perMove: 1,
      speed: 480,
      autoplay: 'pause',
      interval: 3000,
      pauseOnHover: false,
      pauseOnFocus: false,
      resetProgress: true,
      arrows: false,
      pagination: true,
      paginationKeyboard: false,
      drag: false,
      keyboard: false,
      live: false,
      reducedMotion: { speed: 0, rewindSpeed: 0, autoplay: 'pause' },
    });

    instance.mount();
    instances.set(root, instance);
  };

  const start = (root) => {
    const instance = instances.get(root);
    if (!instance || !finePointer.matches || reducedMotion.matches) return;
    instance.Components.Autoplay.play();
  };

  const stop = (root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instance.Components.Autoplay.pause();
    instance.go(0);
  };

  const setup = (scope = document) => {
    scope.querySelectorAll('[data-auto-gallery]').forEach(mount);
  };

  const teardown = (scope) => {
    scope.querySelectorAll('[data-auto-gallery]').forEach((root) => {
      const instance = instances.get(root);
      if (!instance) return;
      instance.destroy(true);
      instances.delete(root);
    });
  };

  document.addEventListener('pointerover', (event) => {
    const card = event.target.closest('[data-product-card][data-gallery-mode="auto"]');
    if (!card || card.contains(event.relatedTarget)) return;
    const root = card.querySelector('[data-auto-gallery]');
    if (root) start(root);
  });

  document.addEventListener('pointerout', (event) => {
    const card = event.target.closest('[data-product-card][data-gallery-mode="auto"]');
    if (!card || card.contains(event.relatedTarget)) return;
    const root = card.querySelector('[data-auto-gallery]');
    if (root) stop(root);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup(), { once: true });
  else setup();
  document.addEventListener('shopify:section:load', (event) => setup(event.target));
  document.addEventListener('shopify:section:unload', (event) => teardown(event.target));
})();
