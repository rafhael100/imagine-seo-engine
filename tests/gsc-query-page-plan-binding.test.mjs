import test from 'node:test';
import assert from 'node:assert/strict';
import {planOfflineGscQueryPage} from '../src/gsc-query-page-planner.mjs';
import {reviewOfflineGscQueryPagePlannedBatch as review}
  from '../src/gsc-query-page-plan-binding.mjs';

const config={tenantRef:'imagine-demo',siteUrl:'sc-domain:example.com',
  startDate:'2026-10-01',endDate:'2026-10-07',
  authorizationConfirmed:true,rowLimit:2,startRow:0};
const row=(q,url,clicks)=>({
  keys:[q,'https://example.com/'+url],clicks,
  impressions:100,ctr:clicks/100,position:9
});
const pages=()=>[
  {startRow:0,rows:[row('marketing','a',5),row('sites','b',4)],
    responseAggregationType:'byPage'},
  {startRow:2,rows:[row('marketing','c',3)],
    responseAggregationType:'byPage'}
];
test('F72 binds two response pages to exact F71 plan without leaking terms',()=>{
  const report=review({plan:planOfflineGscQueryPage(config),pages:pages()});
  assert.equal(report.contractVersion,'seo-gsc-query-page-planned-review-offline-v1');
  assert.equal(report.summary.queriesOnMultiplePages,1);
  assert.equal(report.pagination.pagesReceived,2);
  assert.equal(report.pagination.mayHaveMore,false);
  assert.equal(report.oauthVerified,false);
  assert.equal(report.tenantGrantVerified,false);
  assert.equal(report.releaseStatus,'HOLD_AUTHENTICATED_PORTAL_INTEGRATION');
  assert.doesNotMatch(JSON.stringify(report),
    /marketing|https:\/\/example\.com|\/a|\/b|\/c/);
});
test('F72 refuses forged plan grants, endpoint, and shape',()=>{
  const original=planOfflineGscQueryPage(config);
  const variants=[
    {...original,oauthVerified:true},
    {...original,customerDisplayAuthorized:true},
    {...original,tenantRef:'other-tenant'},
    {...original,url:'https://evil.invalid/webmasters/query'},
    {...original,propertyFingerprint:'a'.repeat(64)},
    {...original,body:{...original.body,aggregationType:'byProperty'}},
    {...original,body:{...original.body,dimensions:['page','query']}},
    {...original,accessToken:'SENSITIVE-SHOULD-NOT-BE-ACCEPTED'},
    {...original,body:{...original.body,startRow:2}}
  ];
  for(const plan of variants)
    assert.throws(()=>review({plan,pages:pages()}));
});
test('F72 refuses extra envelope flags and pagination tampering',()=>{
  const plan=planOfflineGscQueryPage(config);
  const invalid=pages();
  invalid[1].startRow=4;
  assert.throws(()=>review({plan,pages:invalid}));
  assert.throws(()=>review({plan,pages:pages(),authorized:true}));
});
