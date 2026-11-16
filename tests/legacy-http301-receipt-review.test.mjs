import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewOfflineLegacyHttp301Receipts as review} from
  '../src/legacy-http301-receipt-review.mjs';

const manifest=()=>({
  sourceType:'operator_supplied_legacy_urls_unverified',
  siteDomain:'example.test',
  canonicalOrigin:'https://example.test/',
  legacyUrls:[
    'http://www.example.test/',
    'https://www.example.test/en-us/'
  ],
  targetRoutes:['/','/en/'],
  candidates:[
    {fromUrl:'http://www.example.test/',toPath:'/',status:301},
    {fromUrl:'https://www.example.test/en-us/',toPath:'/en/',status:301}
  ]
});
const receipt=(fromUrl,target)=>({
  fromUrl,status:301,location:target,finalUrl:target,
  finalStatus:200,redirectHops:1
});
const observations=()=>[
  receipt('http://www.example.test/','https://example.test/'),
  receipt('https://www.example.test/en-us/','https://example.test/en/')
];
const input=rows=>({
  migrationInput:manifest(),
  capture:{sourceType:'operator_supplied_http_head_captures_unverified',
    observations:rows}
});
test('F134 observes exact one-hop 301 evidence, still requires staging human review',()=>{
 const output=review(input(observations()));
 assert.equal(output.reviewStatus,'human_http_staging_review_required');
 assert.deepEqual(output.summary,{
   suppliedReceipts:2,expectedRedirects:2,matched301ToCanonical:2,
   missingReceiptCount:0,wrongRedirectStatusCount:0,
   wrongLocationOrFinalUrlCount:0,wrongFinalStatusCount:0,
   extraHopsCount:0,omittedDiagnostics:0
 });
 assert.deepEqual(output.diagnostics,[]);
 for(const flag of ['actualHttpCaptureAuthenticated',
   'tlsCertificateValidatedByThisModule','redirectTargetEditoriallyVerified',
   'stagingOriginVerified','productionRedirectsVerified',
   'realDeploymentAuthorized','networkPerformed'])
  assert.equal(output[flag],false,flag);
 const text=JSON.stringify(output);
 for(const secret of ['example.test','http://','https://','/en-us/'])
  assert.equal(text.includes(secret),false,secret);
});
test('F134 denies absent receipt even if F127 migration manifest looks complete',()=>{
 const data=input([observations()[0]]);
 const output=review(data);
 assert.equal(output.reviewStatus,'blocked');
 assert.equal(output.summary.missingReceiptCount,1);
 assert.deepEqual(output.diagnostics,[{
   candidateIndex:1,receiptIndex:null,code:'missing_http_receipt'
 }]);
});
test('F134 blocks temporary redirect, extra hops, wrong final URL/status',()=>{
 const rows=observations();
 rows[0].status=302;
 rows[0].redirectHops=2;
 rows[0].finalStatus=404;
 rows[0].location='https://evil.test/?private=value';
 const output=review(input(rows));
 assert.equal(output.reviewStatus,'blocked');
 assert.equal(output.summary.wrongRedirectStatusCount,1);
 assert.equal(output.summary.wrongLocationOrFinalUrlCount,1);
 assert.equal(output.summary.wrongFinalStatusCount,1);
 assert.equal(output.summary.extraHopsCount,1);
 assert.equal(output.summary.matched301ToCanonical,1);
 assert.equal(output.diagnostics.length,4);
 assert.doesNotMatch(JSON.stringify(output),/evil|private|example.test/);
});
test('F134 refuses forged header, unknown source, duplicate and malformed receipt',()=>{
 const testCases=[
  [receipt('https://wrong.test/','https://example.test/')],
  [...observations(),observations()[0]],
  [{...observations()[0],authorization:true}],
  [{...observations()[0],status:'301'}],
  [{...observations()[0],redirectHops:9}]
 ];
 for(const bad of testCases)
  assert.throws(()=>review(input(bad)),/SEO F134/);
 const falseStatus=input(observations());
 falseStatus.migrationInput.candidates[0].status=302;
 assert.throws(()=>review(falseStatus),/SEO F127/);
});
test('F134 rejects hidden getters and sparse arrays without revealing content',()=>{
 const bad=observations()[0];
 Object.defineProperty(bad,'location',{enumerable:true,get(){throw Error('SECRET')}});
 assert.throws(()=>review(input([bad])),/SEO F134/);
 const sparse=Array(2);sparse[0]=observations()[0];
 assert.throws(()=>review(input(sparse)),/SEO F134/);
});
