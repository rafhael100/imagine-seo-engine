import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const workflow=readFileSync(
  new URL('../.github/workflows/seo-f101-comercial-i18n-parity.yml',import.meta.url),
  'utf8'
);
const comercial='f5e4d75bc4ef72597d5265bb83c2c90f4e53c73a';
test('RC39 integration workflow checks out immutable Comercial and audited actions only',()=>{
  const uses=[...workflow.matchAll(/^\s*uses:\s*([^\s#]+)/gm)].map(x=>x[1]);
  assert.deepEqual(uses,[
    'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1',
    'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1'
  ]);
  assert.ok(uses.every(x=>/^[a-z0-9-]+\/[a-z0-9-]+@[0-9a-f]{40}$/.test(x)));
  assert.match(workflow,new RegExp('repository:\\s*rafhael100/imagine-comercial\\s+ref:\\s*'+comercial));
  assert.equal((workflow.match(/persist-credentials:\s*false/g)||[]).length,2);
  assert.match(workflow,/test "\$\(git -C \.qa\/comercial-i18n rev-parse HEAD\)" = f5e4d75bc4ef72597d5265bb83c2c90f4e53c73a/);
});
test('RC39 integration workflow has no privileged deployment or mutable source',()=>{
  assert.match(workflow,/permissions:\s*\n\s*contents: read/);
  assert.match(workflow,/runs-on: ubuntu-24\.04/);
  assert.match(workflow,/timeout-minutes:\s*20/);
  assert.match(workflow,/node-version:\s*'22'/);
  assert.doesNotMatch(workflow,/pull_request_target|workflow_run:|repository_dispatch:|id-token:\s*write|secrets\.|permissions:\s*write-all/);
  assert.doesNotMatch(workflow,/\b(?:wrangler deploy|docker push|npm publish|gh release|kubectl apply|ssh-action)\b/i);
  assert.doesNotMatch(workflow,/\bref:\s*(?:main|master|dev|release\/|refs\/heads)/);
});
test('RC39 production-independent QA enforces language selectors and negative cases',()=>{
  assert.match(workflow,/npm --prefix \.qa\/comercial-i18n ci --no-audit --no-fund/);
  assert.match(workflow,/npm --prefix \.qa\/comercial-i18n run check:dist/);
  assert.match(workflow,/--strict-public-head --fail-on-warnings --multilingual --check-hreflang/);
  for(const file of [
    'scripts/qa-comercial-hreflang-mutation.mjs',
    'scripts/qa-comercial-hreflang-attributes-mutation.mjs',
    'scripts/qa-comercial-i18n-release-contract.mjs'
  ]){
    assert.ok(workflow.includes('node '+file+' .qa/comercial-i18n/dist'),
      'Missing pinned release QA '+file);
  }
  assert.match(workflow,/test -z "\$\(git -C \.qa\/comercial-i18n status --porcelain --untracked-files=no\)"/);
});
