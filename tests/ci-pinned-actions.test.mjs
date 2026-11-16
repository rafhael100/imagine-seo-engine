import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const workflow=readFileSync(new URL('../.github/workflows/seo-f0-validation.yml',import.meta.url),'utf8');

test('CI third-party action identifiers use full immutable SHA-1',()=>{
  const uses=[...workflow.matchAll(/\buses:\s*([^\s#]+)/g)].map(x=>x[1]);
  assert.deepEqual(uses,[
    'actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    'actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1'
  ]);
  assert.ok(uses.every(x=>/^[a-z0-9-]+\/[a-z0-9-]+@[a-f0-9]{40}$/.test(x)));
});
test('CI uses minimal rights, no token persistence, and pinned runners',()=>{
  assert.match(workflow,/permissions:\s*\n\s*contents: read/);
  assert.match(workflow,/persist-credentials: false/);
  assert.match(workflow,/runs-on: ubuntu-24\.04/);
  assert.doesNotMatch(workflow,/pull_request_target|id-token:\s*write|secrets\.|ubuntu-latest/);
});
test('two Node LTS versions remain in test matrix with no deploy action',()=>{
  assert.match(workflow,/node:\s*\['22', '24'\]/);
  assert.match(workflow,/run: npm test/);
  assert.doesNotMatch(workflow,/npm publish|wrangler deploy|docker push|gh release|aws-actions/);
});
