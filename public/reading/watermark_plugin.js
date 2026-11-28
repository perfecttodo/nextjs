const WatermarkPlugin = (() => {
  const WM_ID = 'soft-domain-watermark-layer';
  let observer = null;

  function getSoftDomainLabel() {
    const host = (window.location.host || 'happy-reader').replace(/^www\./i, '');
    const softHost = host.replace(/\./g, ' · ');
    return `快樂小讀者 ｜ ${softHost}`;
  }

  function mount() {
    if (document.getElementById(WM_ID)) return;

    const layer = document.createElement('div');
    layer.id = WM_ID;
    layer.setAttribute('aria-hidden', 'true');
    layer.textContent = getSoftDomainLabel();

    Object.assign(layer.style, {
      position: 'fixed',
      right: '5px',
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: '1900',
      pointerEvents: 'none',
      writingMode: 'vertical-rl',
      textOrientation: 'mixed',
      letterSpacing: '3px',
      fontSize: '16px',
      fontWeight: '700',
      fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang HK", "Microsoft JhengHei", sans-serif',
      color: 'rgba(71, 85, 105, 0.22)',
      filter: 'blur(0.55px)',
      textShadow: '0 0 2px rgba(255, 255, 255, 0.6)',
      userSelect: 'none',
      WebkitUserSelect: 'none',
      whiteSpace: 'nowrap'
    });

    document.body.appendChild(layer);

    if (!observer) {
      observer = new MutationObserver(() => {
        if (localStorage.getItem('reading_watermark') === 'true' && !document.getElementById(WM_ID)) {
          mount();
        }
      });
      observer.observe(document.body, { childList: true });
    }
  }

  function unmount() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    const layer = document.getElementById(WM_ID);
    if (layer) layer.remove();
  }

  mount();

  return { mount, unmount };
})();
