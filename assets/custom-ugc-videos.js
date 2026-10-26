(() => {
  const roots = new WeakMap();
  const selector = '[data-sanak-ugc]';

  const initialize = (root) => {
    if (roots.has(root)) return;
    const controller = new AbortController();
    const { signal } = controller;
    const track = root.querySelector('[data-ugc-track]');
    const modal = root.querySelector('[data-ugc-modal]');
    const player = root.querySelector('[data-ugc-player]');
    const videos = JSON.parse(root.querySelector('[data-ugc-videos]')?.textContent || '[]');
    let opener;

    const close = () => {
      const video = player?.querySelector('video');
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.querySelectorAll('source').forEach((source) => source.removeAttribute('src'));
        video.load();
      }
      player?.replaceChildren();
      if (modal) modal.hidden = true;
      document.documentElement.style.removeProperty('overflow');
      opener?.focus({ preventScroll: true });
    };

    const open = (index, trigger) => {
      const item = videos[index];
      if (!item?.sources?.length || !modal || !player) return;
      opener = trigger;
      const video = document.createElement('video');
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;
      video.loop = item.loop;
      if (item.poster) video.poster = item.poster;
      item.sources.forEach(({ url, mime_type: type }) => {
        const source = document.createElement('source');
        source.src = url;
        if (type) source.type = type;
        video.append(source);
      });
      player.replaceChildren(video);
      modal.hidden = false;
      document.documentElement.style.overflow = 'hidden';
      modal.querySelector('[data-ugc-close]:not(.sanak-ugc__backdrop)')?.focus();
      video.play().catch(() => {});
    };

    root.addEventListener('click', (event) => {
      const openButton = event.target.closest('[data-ugc-open]');
      if (openButton) open(Number(openButton.dataset.ugcOpen), openButton);
      if (event.target.closest('[data-ugc-close]')) close();
      if (event.target.closest('[data-wishlist-toggle]')) event.stopPropagation();
    }, { signal });
    root.querySelector('[data-ugc-prev]')?.addEventListener('click', () => track.scrollBy({ left: -track.clientWidth, behavior: 'smooth' }), { signal });
    root.querySelector('[data-ugc-next]')?.addEventListener('click', () => track.scrollBy({ left: track.clientWidth, behavior: 'smooth' }), { signal });
    document.addEventListener('keydown', (event) => { if (!modal?.hidden && event.key === 'Escape') close(); }, { signal });
    roots.set(root, { controller, close });
  };

  const find = (scope) => [...(scope.matches?.(selector) ? [scope] : []), ...scope.querySelectorAll(selector)];
  const setup = (scope = document) => find(scope).forEach(initialize);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setup(), { once: true });
  else setup();
  document.addEventListener('shopify:section:load', (event) => setup(event.target));
  document.addEventListener('shopify:section:unload', (event) => find(event.target).forEach((root) => { const instance = roots.get(root); instance?.close(); instance?.controller.abort(); roots.delete(root); }));
})();
