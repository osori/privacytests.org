(() => {
  const runtimeConfig = window.RUNTIME_CONFIG || {};

  const normalizeOrigin = (value) => {
    if (!value) {
      return null;
    }
    try {
      return new URL(value).origin;
    } catch (error) {
      return null;
    }
  };

  const allowedOrigins = new Set(
    [
      window.location.origin,
      runtimeConfig.RESULTS_ROOT,
      runtimeConfig.TEST_PAGES_ROOT_1,
      runtimeConfig.TEST_PAGES_ROOT_2,
      runtimeConfig.TEST_PAGES_ROOT_3
    ]
      .map(normalizeOrigin)
      .filter(Boolean)
  );

  const getTestPagesRoot2 = () => runtimeConfig.TEST_PAGES_ROOT_2 || 'https://test-pages.privacytests2.org';

  const isAllowedOrigin = (origin) => {
    const normalizedOrigin = normalizeOrigin(origin);
    return normalizedOrigin !== null && allowedOrigins.has(normalizedOrigin);
  };

  const startMeFlow = (sessionId) => {
    const encodedSessionId = encodeURIComponent(sessionId);
    const testPagesRoot2 = getTestPagesRoot2();
    const readUrl = `${testPagesRoot2}/supercookies.html?mode=read&thirdparty=same&sessionId=${encodedSessionId}&me=true`;
    const writeUrl = `${testPagesRoot2}/supercookies.html?mode=write&thirdparty=same&sessionId=${encodedSessionId}&me=true`;
    window.open(readUrl, "_blank", "noopener");
    window.location.href = writeUrl;
  };

  window.RUNTIME_HELPERS = Object.freeze({
    getTestPagesRoot2,
    isAllowedOrigin,
    startMeFlow
  });
})();
