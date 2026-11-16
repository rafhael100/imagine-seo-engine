import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewStaticRouteMigration as review} from '../src/redirect-review.mjs';
const report=routes=>({routes});
test('complete mapping remains human review only, never authorizes a 301 or deploy',()=>{
  const result=review({
    before:report(['/','/servicos/']),after:report(['/','/planos/']),
    candidates:[{from:'/servicos/',to:'/planos/'}]
  });
  assert.equal(result.structurallyComplete,true);
  assert.equal(result.removedCount,1);
  assert.equal(result.unmappedCount,0);
  assert.equal(result.deploymentAuthorized,false);
  assert.equal(result.humanReviewRequired,true);
  assert.equal(result.appliedRedirects,0);
  assert.doesNotMatch(JSON.stringify(result),/\/servicos\/|\/planos\//);
});
test('missing mappings stay on HOLD, not treated as approved',()=>{
  const result=review({before:report(['/','/servicos/']),after:report(['/'])});
  assert.equal(result.unmappedCount,1);
  assert.equal(result.structurallyComplete,false);
  assert.equal(result.deploymentAuthorized,false);
});
test('no route loss stays informational, never grants deployment authority',()=>{
  const result=review({before:report(['/']),after:report(['/','/blog/'])});
  assert.equal(result.humanReviewRequired,false);
  assert.equal(result.deploymentAuthorized,false);
  assert.equal(result.addedCount,1);
});
test('rejects unlisted source, destination or circular self-mapping',()=>{
  const base={before:report(['/','/old/']),after:report(['/','/new/'])};
  for(const candidate of [{from:'/unknown/',to:'/new/'},
    {from:'/old/',to:'/not-built/'},{from:'/old/',to:'/old/'},
    {from:'/old/',to:'/404.html'}]){
    assert.throws(()=>review({...base,candidates:[candidate]}),/invalid, duplicate or unsupported/);
  }
});
test('blocks duplicates, external URLs, queries and percent encoded variants',()=>{
  const base={before:report(['/','/old/']),after:report(['/','/new/'])};
  const valid={from:'/old/',to:'/new/'};
  assert.throws(()=>review({...base,candidates:[valid,valid]}),/invalid, duplicate or unsupported/);
  for(const malicious of ['https://evil.test/','//evil.test/','/new/?x=1','/%2e%2e/private','/../private','#secret']){
    assert.throws(()=>review({...base,candidates:[{from:'/old/',to:malicious}]}),/invalid route|unsupported/);
  }
});
test('blocks malformed inventories and unrequested candidate metadata',()=>{
  assert.throws(()=>review({before:report(['/','/']),after:report(['/'])}),/duplicate routes/);
  assert.throws(()=>review({before:report(['/../secret']),after:report(['/'])}),/invalid route/);
  assert.throws(()=>review({before:report(['/','/old/']),after:report(['/']),
    candidates:[{from:'/old/',to:'/',authorization:true}]}),/exact from\/to/);
});
