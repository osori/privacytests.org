const hsts2RuntimeConfig = window.RUNTIME_CONFIG || {};
const hsts2HttpsRoot = hsts2RuntimeConfig.HSTS_ROOT || 'https://hsts.privacytests2.org';
const hsts2HttpRoot = hsts2HttpsRoot.replace(/^https:/, 'http:');

const fetchHsts2Resource = async (url) => {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Unexpected response status ${response.status}`);
  }
  await response.text();
  return response;
};

const description = `The HTTP Strict-Transport-Security response header allows a website to signal that it should only be accessed via HTTPS. The browser remembers this directive in a database, but if this database is not partitioned, then it can be used to track users across websites."`;

const errorResult = (error) => ({
  description,
  passed: undefined,
  unsupported: true,
  testFailed: false,
  readDifferentFirstParty: `Error: ${error.message || error}`,
  readSameFirstParty: 'not tested',
  write: 'set HSTS flag',
  read: 'read HSTS flag'
});

const clear_hsts2 = async () => {
  await fetchHsts2Resource(`${hsts2HttpsRoot}/clear_hsts2_file.html`);
};

const set_hsts2 = async () => {
  await clear_hsts2();
  await fetchHsts2Resource(`${hsts2HttpsRoot}/set_hsts2_file.html`);
};

const test_hsts2 = async () => {
  try {
    const response = await fetchHsts2Resource(`${hsts2HttpRoot}/test_hsts2_file.html`);
    const protocol = new URL(response.url).protocol;
    const http = protocol === 'http:';
    const passed = http;
    const result = http ? 'Used http' : 'Upgraded to https';
    return {
      description,
      passed,
      unsupported: false,
      testFailed: false,
      readDifferentFirstParty: result,
      readSameFirstParty: 'not tested',
      write: 'set HSTS flag',
      read: 'read HSTS flag'
    };
  } catch (error) {
    return errorResult(error);
  }
};

console.log('hello from hsts2.js');
