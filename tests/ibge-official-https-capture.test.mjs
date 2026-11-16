import test from 'node:test';
import assert from 'node:assert/strict';
import {captureOfficialIbgeReference as capture,
  OFFICIAL_IBGE_MUNICIPALITIES_URL as URL_IBGE}
  from '../src/ibge-official-https-capture.mjs';

const rows=Array.from({length:5500},(_,i)=>({
  id:2300000+i,
  nome:'Municipio Exemplo '+i,
  'regiao-imediata':{
    'regiao-intermediaria':{UF:{sigla:'CE'}}
  },
  microrregiao:null
}));
function response(body,opts={}){
  const r=new Response(body,{
    status:opts.status??200,
    headers:{
      'content-type':opts.mime??'application/json; charset=utf-8',
      ...opts.headers
    }
  });
  Object.defineProperty(r,'url',{
    configurable:true,value:opts.url??URL_IBGE
  });
  return r;
}
const JSON_ROWS=JSON.stringify(rows);
const success=()=>response(JSON_ROWS);
const mock=reply=>async(url,options)=>{
  assert.equal(url,URL_IBGE,'must NEVER accept operator-provided URL');
  assert.equal(options.method,'GET');
  assert.equal(options.redirect,'error');
  assert.equal(options.credentials,'omit');
  assert.equal(options.cache,'no-store');
  assert.equal(options.headers.Accept,'application/json');
  assert.ok(options.signal instanceof AbortSignal);
  return typeof reply==='function'?reply():reply;
};
const when=new Date('2026-11-15T18:00:00.000Z');

test('F117 captures exact-host HTTPS municipal JSON, hashes bytes, never approves release',async()=>{
  const r=await capture({fetchImpl:mock(success),now:when});
  assert.equal(r.reference.sourceType,
    'operator_supplied_municipality_reference_unverified');
  assert.equal(r.reference.entries.length,5500);
  assert.equal(r.provenance.referenceEntries,5500);
  assert.equal(r.provenance.sourceUrl,URL_IBGE);
  assert.equal(r.provenance.retrievedAtUtc,when.toISOString());
  assert.match(r.provenance.rawJsonSha256,/^[0-9a-f]{64}$/);
  assert.match(r.provenance.normalizedReferenceSha256,/^[0-9a-f]{64}$/);
  assert.equal(r.provenance.officialHostnameAndTransportChecked,true);
  assert.equal(r.provenance.rawContentSignedByIbge,false);
  for(const key of ['territorialEditionConfirmed','municipalityClassificationVerified',
    'allMunicipalitiesCovered','publicationAuthorized','indexingAuthorized'])
    assert.equal(r.provenance[key],false,key);
  assert.equal(r.provenance.networkPerformed,true);
  assert.equal(r.provenance.releaseStatus,
    'HOLD_SOURCE_EDITION_COVERAGE_EDITORIAL_AND_PUBLICATION_REVIEW');
});

test('F117 rejects source spoofing, redirects, HTTP failure and MIME mismatch',async()=>{
  const responses=[
    response(JSON_ROWS,{url:'https://untrusted.example/api/v1/localidades/municipios'}),
    response(JSON_ROWS,{url:'http://servicodados.ibge.gov.br/api/v1/localidades/municipios'}),
    response(JSON_ROWS,{status:302}),
    response(JSON_ROWS,{status:503}),
    response(JSON_ROWS,{mime:'text/html'}),
    response(JSON_ROWS,{mime:'application/geo+json'}),
    response('',{mime:'application/json'})
  ];
  for(const bad of responses){
    await assert.rejects(capture({fetchImpl:mock(bad),now:when}),
      /SEO F117:/);
  }
});

test('F117 rejects malformed and incomplete datasets and suspicious claim fields',async()=>{
  const samples=[
    JSON.stringify(rows.slice(0,100)),
    '{"secret":"PRIVATE_TOKEN_F117"}',
    '<html>service unavailable</html>',
    JSON.stringify([...rows.slice(0,-1),{...rows[0],officiallyVerified:true}]),
    JSON.stringify(rows.map((x,i)=>i===0?{
      ...x,id:'2300000'
    }:x))
  ];
  for(const json of samples){
    await assert.rejects(capture({fetchImpl:mock(()=>response(json)),now:when}));
  }
});
test('F117 rejects announced size over limit before reading, including invalid length',async()=>{
  for(const length of ['8388609','-1','NaN']){
    await assert.rejects(capture({
      fetchImpl:mock(()=>response(JSON_ROWS,{headers:{'content-length':length}})),
      now:when
    }),/source response size rejected/);
  }
});
test('F117 enforces actual size cap if content-length is absent',async()=>{
  const large=' '.repeat(8*1024*1024+1024);
  await assert.rejects(capture({
    fetchImpl:mock(()=>response(large,{mime:'application/json'})),now:when
  }),/source response size rejected/);
});
test('F117 rejects invalid environment before performing network request',async()=>{
  let called=0;
  await assert.rejects(capture({fetchImpl:async()=>{called++;},now:new Date('invalid')}),
    /invalid capture environment/);
  assert.equal(called,0);
  await assert.rejects(capture({fetchImpl:null,now:when}),/invalid capture environment/);
});
