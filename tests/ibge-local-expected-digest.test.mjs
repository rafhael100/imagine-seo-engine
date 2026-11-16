import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {importIbgeFileWithIndependentExpectedSha as make,
  verifyOfflineIbgeFileReceipt as verify}
  from '../src/ibge-local-expected-digest.mjs';

const rows=Array.from({length:5500},(_,i)=>({
  id:2300000+i,nome:'Cidade hipotética '+i,
  'regiao-imediata':{'regiao-intermediaria':{UF:{sigla:'CE'}}},
  microrregiao:null
}));
const text=JSON.stringify(rows);
const sha=s=>createHash('sha256').update(s).digest('hex');
const input=()=>({
  rawText:text,expectedSha256:sha(text),
  now:new Date('2026-11-15T18:00:00.000Z')
});
test('F119 verifies independently provided checksum without claiming official transport',()=>{
  const result=make(input());
  assert.equal(result.reference.entries.length,5500);
  assert.equal(result.receipt.expectedRawSha256,sha(text));
  assert.equal(result.receipt.normalizedReferenceSha256,sha(result.normalizedText));
  for(const flag of ['ibgeHttpsObserved','officialOriginAuthenticated',
    'territorialEditionConfirmed','municipalityTypesVerified',
    'completeMunicipalRegistryVerified','publicationAuthorized',
    'networkPerformed'])assert.equal(result.receipt[flag],false,flag);
  const rechecked=verify({
    rawText:text,referenceText:result.normalizedText,
    receipt:result.receipt
  });
  assert.equal(rechecked.expectedOperatorDigestMatched,true);
  assert.equal(rechecked.normalizedReferenceMatched,true);
  assert.equal(rechecked.ibgeOfficialOriginIndependentlyVerified,false);
  assert.equal(rechecked.publishAllowed,false);
});
test('F119 blocks mismatch and untrusted fields even if source is syntactically JSON',()=>{
  const v=input();
  for(const expectedSha256 of [
    '0'.repeat(64),'PRIVATE_SECRET','abc',sha('{}')
  ])assert.throws(()=>make({...v,expectedSha256}),/SEO F119/);
  const bad={
    rawText:JSON.stringify([...rows,{...rows[0],id:2300000}]),
    expectedSha256:null
  };
  bad.expectedSha256=sha(bad.rawText);
  assert.throws(()=>make(bad),/duplicate municipality geocode/);
});
test('F119 receipt detects replacement of raw file, normalized file or claims',()=>{
  const created=make(input());
  const good={
    rawText:text,referenceText:created.normalizedText,receipt:created.receipt
  };
  assert.throws(()=>verify({...good,rawText:text+' '}),/digest mismatch/);
  assert.throws(()=>verify({...good,
    referenceText:created.normalizedText+' '
  }),/reference or receipt mismatch/);
  for(const edit of [
    {officialOriginAuthenticated:true},
    {publicationAuthorized:true},
    {networkPerformed:true},
    {expectedRawSha256:'0'.repeat(64)},
    {referenceEntries:12},
    {sourceType:'verified_official_ibge'},
    {extraPrivateField:'SECRET'}
  ])assert.throws(()=>verify({...good,receipt:{
    ...created.receipt,...edit
  }}),/SEO F119/);
});
test('F119 rejects incomplete local datasets even with matching hash',()=>{
  const partial=JSON.stringify(rows.slice(0,99));
  assert.throws(()=>make({
    rawText:partial,expectedSha256:sha(partial)
  }),/incomplete or unbounded/);
});
