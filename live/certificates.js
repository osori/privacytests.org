const fs = require('fs');
const path = require('node:path');

const helperCertsDir = process.env.HELPER_CERTS_DIR || '/etc/privacytests/certs';

const certificatePathsForOrigin = (origin) => {
  const hostname = new URL(origin).hostname;
  return {
    cert: path.join(helperCertsDir, `${hostname}.crt`),
    key: path.join(helperCertsDir, `${hostname}.key`)
  };
};

const readTlsOptionsForOrigin = (origin) => {
  const { cert, key } = certificatePathsForOrigin(origin);
  return {
    cert: fs.readFileSync(cert),
    key: fs.readFileSync(key)
  };
};

module.exports = {
  certificatePathsForOrigin,
  helperCertsDir,
  readTlsOptionsForOrigin
};
