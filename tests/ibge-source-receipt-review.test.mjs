import test from 'node:test';
import assert from 'node:assert/strict';
import {captureOfficialIbgeReference,OFFICIAL_IBGE_MUNICIPALITIES_URL}
  from '../src/ibge-official-https-capture.mjs';
import {verifyIbgeSourceReceipt as verify}
  from '../src/ibge-source-receipt-review.mjs';

const municipalities=Array.from({length:5500},(_,i)=>({
  id:2300000+i,nome:'Cidade Sintética '+i,
  'regiao-imediata':{'regiao-intermediaria':{UF:{sigla:'CE'}}},
  microrregiao:null
}));
const capture=async()=>{
  const http=new Response(JSON.stringify(municipalities),{
    headers:{'content-type':'application/json'}
  });
  Object.defineProperty(http,'url',{value:OFFICIAL_IBGE_MUNICIPALITIES_URL});
  return captureOfficialIbgeReference({
    fetchImpl:async()=>http,now:new Date('2026-11-15T18:00:00.000Z')
  });
};
test('receipt matches exact downloaded bytes without promoting official edition',async()=>{
  const c=await capture();
  const r=verify(c.normalizedText,c.provenance);
  assert.equal(r.referenceEntries,5500);
  assert.equal(r.normalizedDigestMatches,true);
  assert.equal(r.releaseAuthorized,false);
  assert.equal(r.officialEditionSignatureVerified,false);
  assert.equal(r.networkPerformed,false);
});
test('tampered reference or fabricated authority is rejected',async()=>{
  const c=await capture();
  assert.throws(()=>verify(c.normalizedText.replace('Cidade Sintética 0','Cidade Fantasia'),c.provenance),
    /digest mismatch/);
  for(const patch of [
    {sourceUrl:'https://attacker.example/municipios'},
    {officialHostnameAndTransportChecked:false},
    {rawContentSignedByIbge:true},
    {territorialEditionConfirmed:true},
    {allMunicipalitiesCovered:true},
    {publicationAuthorized:true},
    {releaseStatus:'PUBLISHED'},
    {referenceEntries:5499},
    {normalizedReferenceSha256:'0'.repeat(64)},
    {extraCredential:'private'}
  ])assert.throws(()=>verify(c.normalizedText,{...c.provenance,...patch}),/SEO F117/);
});
test('invalid normalized structure cannot bypass receipt by replacing signed hash',async()=>{
  const c=await capture();
  const reference=JSON.parse(c.normalizedText);
  reference.entries[0].state='INVALID';
  // Even with impossible receipts that might be recalculated by a caller,
  // the accepted schema and sorted distinct codes are independently checked.
  const unsafe=JSON.stringify(reference,null,2)+'\n';
  const {createHash}=await import('node:crypto');
  const digest=createHash('sha256').update(unsafe).digest('hex');
  assert.throws(()=>verify(unsafe,{
    ...c.provenance,normalizedReferenceSha256:digest
  }),/entries invalid/);
});
