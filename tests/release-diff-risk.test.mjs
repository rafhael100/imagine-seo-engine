import test from 'node:test';
import assert from 'node:assert/strict';
import {categorizeReleaseDiff as review} from '../src/release-diff-risk.mjs';

test('F160 classifies all paths exactly once and never grants release permission',()=>{
 const x=review([
  '.github/workflows/release.yml',
  'src/tenant-auth.mjs',
  'labs/docker-nginx.mjs',
  'src/ibge-municipal.mjs',
  'scripts/gsc-portal-handoff.mjs',
  'tests/release.test.mjs',
  'docs/runbook.md',
  'src/opportunities.mjs'
 ]);
 assert.equal(x.changedPaths,8);
 assert.equal(Object.values(x.categories).reduce((a,b)=>a+b,0),8);
 assert.equal(x.criticalReviewPaths,3);
 assert.equal(x.categories.territorial_editorial,1);
 assert.equal(x.categories.integration,1);
 assert.equal(x.categories.tests,1);
 assert.equal(x.categories.documentation,1);
 assert.equal(x.categories.other,1);
 assert.equal(x.releaseStatus,'HOLD_INDEPENDENT_DIFF_SOURCE_AND_OPERATIONAL_GATES');
 for(const key of ['publicationAuthorized','mergeAuthorized','deployAuthorized','networkPerformed'])
  assert.equal(x[key],false);
 assert.equal(x.independentReviewRequired,true);
 assert.ok(Object.isFrozen(x));
 assert.ok(Object.isFrozen(x.categories));
});
test('F160 refuses empty, repeated and unsafe paths rather than a false clean report',()=>{
 for(const paths of [[],null,{},[''],['a','a'],['../secrets'],
  ['/etc/passwd'],['src//page.mjs'],['src/./page.mjs'],['src\\secrets'],
  ['src/x\nprivate'],['x'.repeat(401)]])
  assert.throws(()=>review(paths),/F160:/);
});
test('F160 handles documentation-only diff without ever suggesting approval',()=>{
 const x=review(['docs/guide.md']);
 assert.equal(x.criticalReviewPaths,0);
 assert.equal(x.independentReviewRequired,true);
 assert.equal(x.publicationAuthorized,false);
});
