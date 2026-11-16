import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewCommercialWorkflowParity as check}
 from '../src/commercial-workflow-sha-parity.mjs';
const sha='a'.repeat(40);
const source=value=>[
 'steps:',
 '  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
 '    with:',
 '      repository: rafhael100/imagine-comercial',
 '      ref: '+value,
 '  - run: |',
 '      test "$(git -C .qa/comercial-current rev-parse HEAD)" = '+value
].join('\n');
test('F164 exact same pinned SHA allows review, not release',()=>{
 const x=check(source(sha),source(sha));
 assert.equal(x.sharedPinnedCommercialSha,sha);
 assert.equal(x.checkedWorkflows,2);
 assert.equal(x.releaseStatus,'HOLD_INDEPENDENT_REVIEW_AND_OPERATIONAL_GATES');
 for(const key of ['publicationAuthorized','deployAuthorized','mergeAuthorized'])
  assert.equal(x[key],false);
});
test('F164 rejects drift, moving refs and spoofed checkout assertions',()=>{
 assert.throws(()=>check(source(sha),source('b'.repeat(40))),/different Comercial/);
 assert.throws(()=>check(source(sha),source('main')),/pinned Comercial/);
 assert.throws(()=>check(source(sha),source(sha).replace('= '+sha,'= '+'c'.repeat(40))),/pinned Comercial/);
 assert.throws(()=>check(source(sha),source(sha).replace('rafhael100/imagine-comercial','other/repo')),/pinned Comercial/);
 assert.throws(()=>check(source(sha),source(sha)+'\n  ref: '+sha),/pinned Comercial/);
});
test('F164 refuses empty inputs and forged approvals',()=>{
 assert.throws(()=>check('',source(sha)),/F164/);
 assert.throws(()=>check(source(sha),null),/F164/);
});
