(() => {
  const defaults = {
    TEST_PAGES_ROOT_1: 'https://test-pages.privacytests.org',
    TEST_PAGES_ROOT_2: 'https://test-pages.privacytests2.org',
    TEST_PAGES_ROOT_3: 'https://test-pages.privacytests3.org',
    RESULTS_ROOT: 'https://results.privacytests.org'
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
    RESULTS_ROOT: normalizeOrigin(existing.RESULTS_ROOT, defaults.RESULTS_ROOT)
  });
})();
