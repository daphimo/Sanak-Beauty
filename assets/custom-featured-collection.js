(() => {
  if (window.customFeaturedCollectionBooted) return;
  window.customFeaturedCollectionBooted = true;

  const instances = new WeakMap();
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
        stylesheet.dataset.custFeaturedAsset = 'splide-css';
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
      script.dataset.custFeaturedAsset = 'splide-js';
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });

    return splidePromise;
  };

  const destroy = (root) => {
    const instance = instances.get(root);
    if (!instance) return;
    instance.destroy(true);
    root.classList.remove('is-slider-ready');
    instances.delete(root);
  };

  const mount = async (root) => {
    if (instances.has(root) || root.dataset.sliderEnabled !== 'true') return;
    if (root.querySelectorAll('.cust-featured__slide').length < 2) return;

    try {
      await loadSplide(root);
    } catch (error) {
      console.error('Featured collection slider could not load Splide.', error);
      return;
    }

    if (!root.isConnected || instances.has(root) || !window.Splide) return;

    const behavior = root.dataset.behavior;
    const showNavigation = root.dataset.showNavigation === 'true';
    const instance = new window.Splide(root, {
      type: behavior === 'loop' ? 'loop' : 'slide',
      rewind: behavior === 'rewind',
      perPage: Number(root.dataset.perPageDesktop),
      perMove: 1,
      gap: `${Number(root.dataset.gap)}px`,
      speed: Number(root.dataset.speed),
      drag: root.dataset.drag === 'true',
      arrows: showNavigation,
      pagination: false,
      keyboard: 'focused',
      live: false,
      breakpoints: {
        989: { perPage: Number(root.dataset.perPageTablet) },
        749: {
          perPage: Number(root.dataset.perPageMobile),
          arrows: showNavigation && root.dataset.mobileNavigation === 'true',
        },
      },
      reducedMotion: { speed: 0, rewindSpeed: 0 },
    });

    instance.on('mounted resized updated', () => {
      const overflow = instance.Components.Layout.isOverflow();
      root.querySelector('.cust-featured__arrows')?.classList.toggle('is-hidden', !overflow);
    });

    instance.mount();
    root.classList.add('is-slider-ready');
    instances.set(root, instance);
  };

  const setup = (scope = document) => {
    scope.querySelectorAll('[data-cust-featured]').forEach(mount);
  };

  const teardown = (scope) => {
    scope.querySelectorAll('[data-cust-featured]').forEach(destroy);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup());
  else setup();

  document.addEventListener('shopify:section:load', (event) => setup(event.target));
  document.addEventListener('shopify:section:unload', (event) => teardown(event.target));
})();
