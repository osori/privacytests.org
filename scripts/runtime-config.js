const DEFAULT_RUNTIME_CONFIG = Object.freeze({
  TEST_PAGES_ROOT_1: 'https://test-pages.privacytests.org',
  TEST_PAGES_ROOT_2: 'https://test-pages.privacytests2.org',
  TEST_PAGES_ROOT_3: 'https://test-pages.privacytests3.org',
  RESULTS_ROOT: 'https://results.privacytests.org'
});

const normalizeOrigin = (value, fallback) => {
  const candidate = (value || fallback || '').toString().trim();
  return candidate.replace(/\/+$/, '');
};

const getRuntimeConfig = (env = process.env) => ({
  TEST_PAGES_ROOT_1: normalizeOrigin(env.TEST_PAGES_ROOT_1, DEFAULT_RUNTIME_CONFIG.TEST_PAGES_ROOT_1),
  TEST_PAGES_ROOT_2: normalizeOrigin(env.TEST_PAGES_ROOT_2, DEFAULT_RUNTIME_CONFIG.TEST_PAGES_ROOT_2),
  TEST_PAGES_ROOT_3: normalizeOrigin(env.TEST_PAGES_ROOT_3, DEFAULT_RUNTIME_CONFIG.TEST_PAGES_ROOT_3),
  RESULTS_ROOT: normalizeOrigin(env.RESULTS_ROOT, DEFAULT_RUNTIME_CONFIG.RESULTS_ROOT)
});

module.exports = {
  DEFAULT_RUNTIME_CONFIG,
  getRuntimeConfig
};
