import { runAllTests } from "./test_utils.js";
import { tests } from "./test_definitions.js";

// Wrap the code for any browsers that don't support top-level await.
(async () => {

const runtimeConfig = window.RUNTIME_CONFIG || {};
const testPagesRoot2 = runtimeConfig.TEST_PAGES_ROOT_2 || 'https://test-pages.privacytests2.org';
const baseURI = `${testPagesRoot2}/live/`;

let testURI = (path, type, key) => `${baseURI}${path}?type=${type}&key=${key}`;

await runAllTests(await tests(), { category: "navigation" });

console.log("hello from navigation_inner.js");

})();
