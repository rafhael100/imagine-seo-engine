import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {planOfflineGscQueryPage as plan}
  from '../src/gsc-query-page-planner.mjs';

const prop='sc-domain:example.com';
const input={tenantRef:'imagine-demo',siteUrl:prop,
  startDate:'2026-10-01',endDate:'2026-10-07',
  authorizationConfirmed:true,rowLimit:1000,startRow:0};

test('F71 plans bounded read-only query/page request without network',()=>{
  const p=plan(input);
  assert.equal(p.contractVersion,'seo-gsc-query-page-plan-offline-v1');
  assert.equal(p.url,
    'https://www.googleapis.com/webmasters/v3/sites/'+
    encodeURIComponent(prop)+'/searchAnalytics/query');
  assert.equal(p.propertyFingerprint,
    createHash('sha256').update(prop).digest('hex'));
  assert.deepEqual(p.body.dimensions,['query','page']);
  assert.equal(p.body.aggregationType,'byPage');
  assert.equal(p.body.dataState,'final');
  assert.equal(p.body.rowLimit,1000);
  assert.equal(p.body.startRow,0);
  assert.equal(p.requiredOAuthScope,
    'https://www.googleapis.com/auth/webmasters.readonly');
  for(const key of ['oauthVerified','propertyAccessVerified',
    'tenantGrantVerified','customerDisplayAuthorized',
    'productionReadAuthorized','networkPerformed'])
    assert.equal(p[key],false);
  assert.equal(p.releaseStatus,'HOLD_AUTHENTICATED_PORTAL_INTEGRATION');
  assert.ok(Object.isFrozen(p.body));
  assert.ok(Object.isFrozen(p.body.dimensions));
});

test('F71 accepts exactly four aligned page offsets',()=>{
  const values=[0,1000,2000,3000].map(startRow=>
    plan({...input,startRow}).body.startRow);
  assert.deepEqual(values,[0,1000,2000,3000]);
});

test('F71 rejects bad paging, scope and spoofed grant flags',()=>{
  for(const change of [
    {rowLimit:1001},{rowLimit:0},{rowLimit:1000,startRow:1},
    {rowLimit:500,startRow:2000},{startRow:-1},
    {authorizationConfirmed:false},
    {tenantRef:'other tenant'},
    {oauthVerified:true},{accessToken:'FAKE_SECRET'},
    {startDate:'2026-02-29'},
    {siteUrl:'https://user@example.com/blog/'}
  ])assert.throws(()=>plan({...input,...change}));
});

test('F71 leaves property URLs in internal plans only, never authorizes display',()=>{
  const p=plan({...input,siteUrl:'https://example.com/blog/'});
  assert.match(p.url,/sites\/https%3A%2F%2Fexample\.com%2Fblog%2F/);
  assert.equal(p.customerDisplayAuthorized,false);
  assert.equal(p.productionReadAuthorized,false);
});
