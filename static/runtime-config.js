(() => {
  const defaults = {
    TEST_PAGES_ROOT_1: 'https://test-pages.ij.fyi',
    TEST_PAGES_ROOT_2: 'https://test-pages.ij2.qzz.io',
    TEST_PAGES_ROOT_3: 'https://test-pages.ij3.qzz.io',
    RESULTS_ROOT: 'https://results.ij.fyi',
    UPGRADABLE_ROOT: 'http://upgradable.ij2.qzz.io',
    INSECURE_ROOT_2: 'http://insecure.ij2.qzz.io',
    INSECURE_ROOT_3: 'http://insecure.ij3.qzz.io',
    HSTS_ROOT: 'https://hsts.ij2.qzz.io',
    TLS_ROOT: 'https://tls.ij2.qzz.io:8900',
    H1_ROOT: 'https://h1.ij2.qzz.io:8901',
    H2_ROOT: 'https://h2.ij2.qzz.io:8902',
    H3_ROOT: 'https://h3.ij2.qzz.io:4434',
    ALTSVC_ROOT_2: 'https://altsvc.ij2.qzz.io:4433',
    ALTSVC_ROOT_3: 'https://altsvc.ij3.qzz.io:4435'
  };

  const normalizeOrigin = (value, fallback) => {
    const candidate = (value ?? fallback).toString().trim();
    return candidate.replace(/\/+$/, '');
  };

  const existing = window.RUNTIME_CONFIG || {};
  window.RUNTIME_CONFIG = Object.freeze({
    TEST_PAGES_ROOT_1: normalizeOrigin(existing.TEST_PAGES_ROOT_1, defaults.TEST_PAGES_ROOT_1),
    TEST_PAGES_ROOT_2: normalizeOrigin(existing.TEST_PAGES_ROOT_2, defaults.TEST_PAGES_ROOT_2),
    TEST_PAGES_ROOT_3: normalizeOrigin(existing.TEST_PAGES_ROOT_3, defaults.TEST_PAGES_ROOT_3),
    RESULTS_ROOT: normalizeOrigin(existing.RESULTS_ROOT, defaults.RESULTS_ROOT),
    UPGRADABLE_ROOT: normalizeOrigin(existing.UPGRADABLE_ROOT, defaults.UPGRADABLE_ROOT),
    INSECURE_ROOT_2: normalizeOrigin(existing.INSECURE_ROOT_2, defaults.INSECURE_ROOT_2),
    INSECURE_ROOT_3: normalizeOrigin(existing.INSECURE_ROOT_3, defaults.INSECURE_ROOT_3),
    HSTS_ROOT: normalizeOrigin(existing.HSTS_ROOT, defaults.HSTS_ROOT),
    TLS_ROOT: normalizeOrigin(existing.TLS_ROOT, defaults.TLS_ROOT),
    H1_ROOT: normalizeOrigin(existing.H1_ROOT, defaults.H1_ROOT),
    H2_ROOT: normalizeOrigin(existing.H2_ROOT, defaults.H2_ROOT),
    H3_ROOT: normalizeOrigin(existing.H3_ROOT, defaults.H3_ROOT),
    ALTSVC_ROOT_2: normalizeOrigin(existing.ALTSVC_ROOT_2, defaults.ALTSVC_ROOT_2),
    ALTSVC_ROOT_3: normalizeOrigin(existing.ALTSVC_ROOT_3, defaults.ALTSVC_ROOT_3)
  });
})();
