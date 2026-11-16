import test from 'node:test';
import assert from 'node:assert/strict';
import {assessSeoReleaseEvidence as inspect,SEO_F162_REQUIRED_GATES as gates}
 from '../src/release-evidence-inventory.mjs';
const candidateSha='a'.repeat(40);
const operator=new Set(['gsc_tenant_authorization','leaseweb_staging_security',
 'backup_restore_drill','rollback_drill']);
const entry=(gate,i=0)=>({
 gate,candidateSha,evidenceDigest:(i+1).toString(16).padStart(64,'0'),
 sourceClass:gate==='ibge_source_authentication'?'official_source':
  operator.has(gate)?'operator_record':'independent_review',reviewed:true
});
const envelope=(evidence)=>({candidateSha,evidence});
test('F162 empty evidence keeps all release gates blocked',()=>{
 const result=inspect(envelope([]));
 assert.equal(result.requiredGateCount,9);
 assert.equal(result.submittedReviewedReceipts,0);
 assert.deepEqual(result.missingGates,gates);
 assert.equal(result.releaseStatus,'HOLD_MISSING_RELEASE_EVIDENCE');
 for(const field of ['authenticityVerified','operationallyHomologated',
  'publicationAuthorized','mergeAuthorized','deployAuthorized','networkPerformed'])
  assert.equal(result[field],false);
 assert.ok(Object.isFrozen(result));
 assert.ok(Object.isFrozen(result.missingGates));
});
test('F162 all self-reported receipts still cannot authorize deployment',()=>{
 const result=inspect(envelope(gates.map((gate,i)=>entry(gate,i))));
 assert.equal(result.submissionComplete,true);
 assert.deepEqual(result.missingGates,[]);
 assert.equal(result.releaseStatus,'HOLD_INDEPENDENT_EVIDENCE_AUTHENTICATION');
 assert.equal(result.authenticityVerified,false);
 assert.equal(result.publicationAuthorized,false);
 assert.equal(result.operationallyHomologated,false);
});
test('F162 refuses candidate mismatch, duplicate and false reviewed receipts',()=>{
 for(const bad of [
  [entry('independent_code_review'),entry('independent_code_review')],
  [{...entry('ibge_source_authentication'),candidateSha:'c'.repeat(40)}],
  [{...entry('ibge_source_authentication'),reviewed:false}],
  [{...entry('ibge_source_authentication'),sourceClass:'synthetic'}],
  [{...entry('ibge_source_authentication'),sourceClass:'operator_record'}],
  [entry('independent_code_review'),entry('municipal_editorial_review')],
  [{...entry('ibge_source_authentication'),evidenceDigest:'invalid'}],
  [{...entry('ibge_source_authentication'),secret:'leak'}],
  [{...entry('unknown_gate')}]
 ])assert.throws(()=>inspect(envelope(bad)),/F162:/);
});
test('F162 refuses fake approval fields and incomplete envelopes',()=>{
 for(const bad of [
  null,{},[],{candidateSha,evidence:[],publicationAuthorized:true},
  {candidateSha:'INVALID',evidence:[]},
  {candidateSha,evidence:{}}
 ])assert.throws(()=>inspect(bad),/F162:/);
});
