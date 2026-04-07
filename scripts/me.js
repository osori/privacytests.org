const template = require('./template.js');
const fs = require('fs');
const path = require('node:path');
const scriptHtml = `
<script src="./runtime-config.js"></script>
<script src="./runtime-helpers.js"></script>
<script>
  function runTest() {
    const sessionId = Math.random().toString().substr(2);
    window.RUNTIME_HELPERS.startMeFlow(sessionId);
  }
</script>
`;

const testButtonElement = `
<div class="content-container">
  <button type="button" id="run-test" onclick="runTest()">Test my Browser</button>
</div>
`;

const contentHtml = scriptHtml + testButtonElement;

const writePage = (destinationPath) => {
  fs.writeFileSync(destinationPath,
    template.htmlPage({
      content: contentHtml,
      cssFiles: [
        path.join(__dirname, '/../assets/css/me.css'),
        path.join(__dirname, '/../assets/css/template.css')
      ],
      canonicalUrl: 'me.html',
      title: 'Test my browser'
    }));
};

const main = () => {
  writePage(path.join(__dirname, '/../website/me.html'));
  writePage(path.join(__dirname, '/../static/me.html'));
};

main();
