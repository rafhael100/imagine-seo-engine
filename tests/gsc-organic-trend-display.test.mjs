import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareOfflineGscOrganicTrendDisplay as view}
  from '../src/gsc-organic-trend-display.mjs';

const make=(query,clicks,impressions,position=8)=>({
  keys:[query],clicks,impressions,
  ctr:impressions?clicks/impressions:0,position
});
const window=(startDate,endDate,rows)=>({
  dimensions:['query'],startDate,endDate,rows
});
const fixture=()=>({
  previous:window('2026-10-01','2026-10-07',[
    make('PRIVATE-F86-TERM landing pages',30,300),
    make('sites profissionais',20,200)
  ]),
  current:window('2026-10-08','2026-10-14',[
    make('PRIVATE-F86-TERM landing pages',5,150),
    make('sites profissionais',16,220)
  ])
});
function noAuthority(o){
  for(const key of [
    'oauthVerified','propertyAuthorizationVerified','backendTenantGrantVerified',
    'customerDisplayAuthorized','publicationAuthorized','networkPerformed'
  ])assert.equal(o[key],false,key);
  assert.equal(o.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
  assert.equal(o.reviewStatus,'REQUIRES_AUTHENTICATED_HUMAN_REVIEW');
  assert.doesNotMatch(JSON.stringify(o),
    /PRIVATE-F86-TERM|123\.456\.789-09|pessoa@example\.com/);
}

test('F86 recomputes safe clusters and trends only from original submitted rows',()=>{
  const a=view(fixture());
  assert.equal(a.contractVersion,'seo-gsc-organic-trend-display-offline-v1');
  assert.equal(a.coverageStatus,'SUPPLIED_ROWS_ONLY_NOT_VERIFIED');
  assert.equal(a.metricsWithheld,false);
  assert.equal(a.metricsWithheldReason,null);
  assert.deepEqual(a.summary.receivedRows,{previous:2,current:2});
  assert.deepEqual(a.summary.previous,{clicks:50,impressions:500});
  assert.deepEqual(a.summary.current,{clicks:21,impressions:370});
  assert.ok(a.changes.some(x=>x.signals.includes('investigate_clicks_drop')));
  assert.equal(a.summary.flaggedClusters,
    a.changes.filter(x=>x.signals.length).length);
  assert.deepEqual(view(fixture()),a);
  noAuthority(a);
});

test('F86 suppresses ALL trend indicators if either window has private CPF/CNPJ',()=>{
  for(const position of ['previous','current']){
    const input=fixture();
    input[position].rows.push(make('123.456.789-09',1,100));
    const a=view(input);
    assert.equal(a.coverageStatus,'REDACTED_ROWS_NO_COMPARISON');
    assert.equal(a.metricsWithheld,true);
    assert.equal(a.metricsWithheldReason,'PRIVACY_REDACTION');
    assert.deepEqual(a.changes,[]);
    assert.equal(a.summary.redactedRows,1);
    assert.equal(a.summary.previous,null);
    assert.equal(a.summary.current,null);
    assert.equal(a.summary.clicksChangePct,null);
    assert.equal(a.summary.impressionsChangePct,null);
    assert.equal(a.summary.flaggedClusters,0);
    assert.deepEqual(a.summary.receivedRows,{
      previous:position==='previous'?3:2,
      current:position==='current'?3:2
    });
    noAuthority(a);
  }
});

test('F86 rejects caller-computed summaries, grants and private metadata',()=>{
  const good=fixture();
  const bad=[
    {previous:good.previous,current:good.current,summary:{clicks:999}},
    {previous:good.previous,current:good.current,
      customerDisplayAuthorized:true},
    {previous:{...good.previous,oauthVerified:true},current:good.current},
    {previous:good.previous,current:{...good.current,rawQuery:'pessoa@example.com'}},
    {previous:{...good.previous,
      rows:[{...good.previous.rows[0],grant:true}]},current:good.current},
    {previous:{...good.previous,
      rows:[{...good.previous.rows[0],keys:['one','another']}]},
      current:good.current},
    {previous:good.previous,current:{...good.current,
      rows:[good.current.rows[0],good.current.rows[0]]}},
    {report:view(good)}
  ];
  for(const sample of bad){
    assert.throws(()=>view(sample),{
      name:'Error'
    });
  }
});

test('F86 rejects invalid windows, sparse arrays and accessor payloads',()=>{
  const sample=fixture();
  const overlapping=fixture();
  overlapping.current.startDate='2026-10-07';
  assert.throws(()=>view(overlapping),/period|equal windows|overlap/);
  const sparse=fixture();
  sparse.current.rows=Array(1);
  assert.throws(()=>view(sparse),/original query export/);
  const access=fixture();
  Object.defineProperty(access.current,'rows',{
    enumerable:true,get(){throw Error('SENSITIVE-F86-GETTER');}
  });
  assert.throws(()=>view(access),/original query export/);
  const symbols=fixture();
  symbols.previous[Symbol('private')]='secret';
  assert.throws(()=>view(symbols),/original query export/);
  const forgedArray=fixture();
  forgedArray.previous.rows[Symbol.iterator]=function*(){yield make('fake',1,100)};
  assert.throws(()=>view(forgedArray),/original query export/);
});

test('F86 supports empty supplied periods without fabricated rankings',()=>{
  const f=fixture();
  f.previous.rows=[];f.current.rows=[];
  const a=view(f);
  assert.equal(a.metricsWithheld,false);
  assert.equal(a.summary.previous.impressions,0);
  assert.equal(a.summary.clicksChangePct,null);
  assert.deepEqual(a.changes,[]);
  noAuthority(a);
});

test('F89 Unicode disguised personal queries withhold all display metrics',()=>{
  for(const query of [
    '１２３．４５６．７８９－０９',
    'CPF\u200b 12345678909',
    'pessoa＠exemplo.com'
  ]){
    const input=fixture();
    input.previous.rows.push(make(query,1,100));
    const summary=view(input);
    assert.equal(summary.metricsWithheld,true);
    assert.equal(summary.summary.redactedRows,1);
    assert.equal(summary.summary.previous,null);
    assert.equal(summary.summary.current,null);
    assert.deepEqual(summary.changes,[]);
    assert.ok(!JSON.stringify(summary).includes(query));
    noAuthority(summary);
  }
});
