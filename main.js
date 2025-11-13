
(function(){
  const suspicious = (() => {
    const ua = (navigator.userAgent || '').toLowerCase();
    const suspects = ['curl', 'wget', 'python-requests', 'httpclient', 'postman', 'insomnia', 'powershell'];
    return suspects.some(s => ua.includes(s));
  })();

  const canRun = typeof window !== 'undefined' && typeof document !== 'undefined' && 'fetch' in window;

  if (!canRun || suspicious) {
    const el = document.body;
    if (el) {
      el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100dvh;color:#e2e8f0;background:#0a0e27;font-family:Segoe UI,Inter,sans-serif"><div style="max-width:640px;text-align:center;padding:24px;border:1px solid rgba(148,163,184,.25);border-radius:14px;background:rgba(15,23,42,.6);backdrop-filter:blur(10px)">This interactive site is not available in this environment.</div></div>';
    }
    return;
  }

  const loadLegacyBundle = () => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = './dist/app.bundle.js';
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = error => reject(error);
    document.head.appendChild(script);
  });

  const loadApp = async () => {
    try {
      await import('./script.js');
      console.debug('[DemoMed] Loaded module entry');
    } catch (error) {
      console.error('[DemoMed] Module load failed, falling back to bundled runtime', error);
      try {
        await loadLegacyBundle();
        console.debug('[DemoMed] Loaded fallback bundle');
      } catch (fallbackError) {
        console.error('[DemoMed] Fallback bundle failed', fallbackError);
        const el = document.getElementById('chatArea') || document.body;
        if (el) {
          const msg = document.createElement('div');
          msg.style.cssText = 'margin:16px;color:#64748b;font-weight:700';
          msg.textContent = 'Failed to initialize. Please refresh the page.';
          el.appendChild(msg);
        }
      }
    }
  };

  loadApp();
})();
