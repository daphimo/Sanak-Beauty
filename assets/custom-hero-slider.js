(() => {
  if (window.customHeroSliderBooted) return;
  window.customHeroSliderBooted = true;

  const instances = new WeakMap();
  let splidePromise;

  const loadAsset = (type, url, marker) => {
    const existing = document.querySelector(`[data-cust-hero-asset="${marker}"]`);
    if (existing) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const asset = document.createElement(type === 'script' ? 'script' : 'link');
      asset.dataset.custHeroAsset = marker;
      if (type === 'script') {
        asset.src = url;
        asset.defer = true;
      } else {
        asset.rel = 'stylesheet';
        asset.href = url;
      }
      asset.addEventListener('load', resolve, { once: true });
      asset.addEventListener('error', reject, { once: true });
      document.head.appendChild(asset);
    });
  };

  const loadSplide = (root) => {
    if (window.Splide) return Promise.resolve();
    if (!splidePromise) {
      splidePromise = Promise.all([
        loadAsset('link', root.dataset.splideCss, 'splide-css'),
        loadAsset('script', root.dataset.splideJs, 'splide-js'),
      ]);
    }
    return splidePromise;
  };

  const shouldMount = (root) => {
    if (root.dataset.sliderEnabled !== 'true') return false;
    if (root.querySelectorAll('.cust-hero__slide').length < 2) return false;
    const mobile = window.matchMedia('(max-width: 749px)').matches;
    return mobile ? root.dataset.mobileEnabled === 'true' : root.dataset.desktopEnabled === 'true';
  };

  const updateToggle = (button, paused) => {
    if (!button) return;
    button.classList.toggle('is-paused', paused);
    button.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
  };

  const mount = async (root) => {
    if (instances.has(root) || !shouldMount(root)) return;
    await loadSplide(root);
    if (!root.isConnected || instances.has(root) || !shouldMount(root) || !window.Splide) return;

    const autoplay = root.dataset.autoplay === 'true' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = root.dataset.loopBehavior;
    const toggle = root.querySelector('[data-cust-hero-toggle]');
    const instance = new window.Splide(root, {
      type: root.dataset.transition === 'fade' ? 'fade' : behavior === 'loop' ? 'loop' : 'slide',
      rewind: root.dataset.transition === 'fade' ? behavior !== 'stop' : behavior === 'rewind',
      speed: Number(root.dataset.transitionSpeed),
      autoplay,
      interval: Number(root.dataset.interval),
      pauseOnHover: root.dataset.pauseOnHover === 'true',
      pauseOnFocus: true,
      arrows: root.dataset.arrows === 'true',
      pagination: root.dataset.pagination === 'true',
      keyboard: 'global',
      drag: true,
      live: false,
      reducedMotion: { speed: 0, rewindSpeed: 0, autoplay: 'pause' },
    });
    const state = { instance, userPaused: false, visibilityPaused: false, media: null, mediaHandler: null };

    const resetProgress = () => {
      root.querySelectorAll('.splide__pagination__page').forEach((page) => page.style.setProperty('--progress', 0));
    };

    instance.on('mounted move', resetProgress);
    instance.on('autoplay:playing', (rate) => {
      const active = root.querySelector('.splide__pagination__page.is-active');
      if (active) active.style.setProperty('--progress', Math.min(rate, 1));
    });
    instance.on('autoplay:pause', () => updateToggle(toggle, true));
    instance.on('autoplay:play', () => updateToggle(toggle, false));
    instance.mount();
    root.classList.add('is-slider-ready');
    updateToggle(toggle, !autoplay);

    if (toggle && !autoplay) toggle.hidden = true;

    if (toggle && autoplay) {
      state.toggleHandler = () => {
        state.userPaused = !state.userPaused;
        if (state.userPaused) instance.Components.Autoplay.pause();
        else instance.Components.Autoplay.play();
      };
      toggle.addEventListener('click', state.toggleHandler);
    }

    state.visibilityHandler = () => {
      if (!autoplay || state.userPaused) return;
      if (document.hidden) {
        state.visibilityPaused = true;
        instance.Components.Autoplay.pause();
      } else if (state.visibilityPaused) {
        state.visibilityPaused = false;
        instance.Components.Autoplay.play();
      }
    };
    document.addEventListener('visibilitychange', state.visibilityHandler);
    instances.set(root, state);
  };

  const destroy = (root) => {
    const state = instances.get(root);
    if (!state) return;
    if (state.toggleHandler) root.querySelector('[data-cust-hero-toggle]')?.removeEventListener('click', state.toggleHandler);
    document.removeEventListener('visibilitychange', state.visibilityHandler);
    state.instance.destroy(true);
    root.classList.remove('is-slider-ready');
    instances.delete(root);
  };

  const setup = (scope = document) => {
    scope.querySelectorAll('[data-cust-hero]').forEach((root) => {
      if (root._custHeroMediaHandler) return;
      const media = window.matchMedia('(max-width: 749px)');
      const refresh = () => {
        destroy(root);
        mount(root);
      };
      media.addEventListener('change', refresh);
      root._custHeroMedia = media;
      root._custHeroMediaHandler = refresh;
      mount(root);
    });
  };

  const teardown = (scope) => {
    scope.querySelectorAll('[data-cust-hero]').forEach((root) => {
      destroy(root);
      root._custHeroMedia?.removeEventListener('change', root._custHeroMediaHandler);
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup());
  else setup();

  document.addEventListener('shopify:section:load', (event) => setup(event.target));
  document.addEventListener('shopify:section:unload', (event) => teardown(event.target));
  document.addEventListener('shopify:block:select', (event) => {
    const root = event.target.closest('[data-cust-hero]');
    const slide = event.target.closest('.cust-hero__slide');
    const state = root && instances.get(root);
    if (state && slide) state.instance.go(Number(slide.dataset.slideIndex));
  });
})();
