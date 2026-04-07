const DEFAULT_RUNTIME_CONFIG = Object.freeze({
  TEST_PAGES_ROOT_1: 'https://test-pages.privacytests.org',
  TEST_PAGES_ROOT_2: 'https://test-pages.privacytests2.org',
  TEST_PAGES_ROOT_3: 'https://test-pages.privacytests3.org',
  RESULTS_ROOT: 'https://results.privacytests.org',
  UPGRADABLE_ROOT: 'http://upgradable.privacytests2.org',
  INSECURE_ROOT_2: 'http://insecure.privacytests2.org',
  INSECURE_ROOT_3: 'http://insecure.privacytests3.org',
  HSTS_ROOT: 'https://hsts.privacytests2.org',
  TLS_ROOT: 'https://tls.privacytests2.org:8900',
  H1_ROOT: 'https://h1.privacytests2.org:8901',
  H2_ROOT: 'https://h2.privacytests2.org:8902',
  H3_ROOT: 'https://h3.privacytests2.org:4434',
  ALTSVC_ROOT_2: 'https://altsvc.privacytests2.org:4433',
  ALTSVC_ROOT_3: 'https://altsvc.privacytests3.org:4435'
});

const normalizeOrigin = (value, fallback) => {
  const candidate = (value || fallback || '').toString().trim();
  return candidate.replace(/\/+$/, '');
};

const getRuntimeConfig = (env = process.env) => ({
  TEST_PAGES_ROOT_1: normalizeOrigin(env.TEST_PAGES_ROOT_1, DEFAULT_RUNTIME_CONFIG.TEST_PAGES_ROOT_1),
  TEST_PAGES_ROOT_2: normalizeOrigin(env.TEST_PAGES_ROOT_2, DEFAULT_RUNTIME_CONFIG.TEST_PAGES_ROOT_2),
  TEST_PAGES_ROOT_3: normalizeOrigin(env.TEST_PAGES_ROOT_3, DEFAULT_RUNTIME_CONFIG.TEST_PAGES_ROOT_3),
  RESULTS_ROOT: normalizeOrigin(env.RESULTS_ROOT, DEFAULT_RUNTIME_CONFIG.RESULTS_ROOT),
  UPGRADABLE_ROOT: normalizeOrigin(env.UPGRADABLE_ROOT, DEFAULT_RUNTIME_CONFIG.UPGRADABLE_ROOT),
  INSECURE_ROOT_2: normalizeOrigin(env.INSECURE_ROOT_2, DEFAULT_RUNTIME_CONFIG.INSECURE_ROOT_2),
  INSECURE_ROOT_3: normalizeOrigin(env.INSECURE_ROOT_3, DEFAULT_RUNTIME_CONFIG.INSECURE_ROOT_3),
  HSTS_ROOT: normalizeOrigin(env.HSTS_ROOT, DEFAULT_RUNTIME_CONFIG.HSTS_ROOT),
  TLS_ROOT: normalizeOrigin(env.TLS_ROOT, DEFAULT_RUNTIME_CONFIG.TLS_ROOT),
  H1_ROOT: normalizeOrigin(env.H1_ROOT, DEFAULT_RUNTIME_CONFIG.H1_ROOT),
  H2_ROOT: normalizeOrigin(env.H2_ROOT, DEFAULT_RUNTIME_CONFIG.H2_ROOT),
  H3_ROOT: normalizeOrigin(env.H3_ROOT, DEFAULT_RUNTIME_CONFIG.H3_ROOT),
  ALTSVC_ROOT_2: normalizeOrigin(env.ALTSVC_ROOT_2, DEFAULT_RUNTIME_CONFIG.ALTSVC_ROOT_2),
  ALTSVC_ROOT_3: normalizeOrigin(env.ALTSVC_ROOT_3, DEFAULT_RUNTIME_CONFIG.ALTSVC_ROOT_3)
});

module.exports = {
  DEFAULT_RUNTIME_CONFIG,
  getRuntimeConfig
};
