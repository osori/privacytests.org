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
    const testPagesRoot3 = runtimeConfig.TEST_PAGES_ROOT_3 || 'https://test-pages.privacytests3.org';
    
    // Supercookies tests
    const supercookiesReadUrl = `${testPagesRoot2}/supercookies.html?mode=read&thirdparty=same&sessionId=${encodedSessionId}&me=true`;
    const supercookiesWriteUrl = `${testPagesRoot2}/supercookies.html?mode=write&thirdparty=same&sessionId=${encodedSessionId}&me=true`;
    
    // Session storage tests (third-party)
    const sessionWriteUrl = `${testPagesRoot3}/session.html?mode=write&sessionId=${encodedSessionId}&label=3p`;
    const sessionReadUrl = `${testPagesRoot3}/session.html?mode=read&sessionId=${encodedSessionId}&label=3p`;
    
    // First-party session tests  
    const sessionWrite1pUrl = `${testPagesRoot2}/session.html?mode=write&sessionId=${encodedSessionId}&firstParty=true&label=1p`;
    const sessionRead1pUrl = `${testPagesRoot2}/session.html?mode=read&sessionId=${encodedSessionId}&firstParty=true&label=1p`;
    
    // Open read windows for all tests (these will wait for data to be written)
    window.open(supercookiesReadUrl, "_blank", "noopener");
    window.open(sessionReadUrl, "_blank", "noopener");
    window.open(sessionRead1pUrl, "_blank", "noopener");
    
    // Start with session write (first-party), then write supercookies
    window.location.href = supercookiesWriteUrl;
  };

  window.RUNTIME_HELPERS = Object.freeze({
    getTestPagesRoot2,
    isAllowedOrigin,
    startMeFlow
  });
})();
