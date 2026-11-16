import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {compareOfflineTechnicalAudits as compare} from '../src/technical-audit-regression.mjs';

const previousRevision='a'.repeat(40),currentRevision='b'.repeat(40);
const issue=(type)=>({type,file:'PRIVATE-CUSTOMER-DATA.html',message:'PRIVATE-NAME-123'});
const audit=(errors=[],warnings=[],routes=['/', '/servicos/'])=>({
 summary:{pages:routes.length,errors:errors.length,warnings:warnings.length},
 errors:errors.map(issue),warnings:warnings.map(issue),routes
});
const run=(previous,current,extra={})=>compare({
 previous,current,previousRevision,currentRevision,...extra
});

test('F162 detects new indexation and navigation failures without exposing paths or issue text',()=>{
 const previous=audit();
 const current=audit(['unexpected_noindex','wrong_canonical'],['orphan_page']);
 const report=run(previous,current);
 assert.equal(report.routeCoverageComparable,true);
 assert.deepEqual(report.routeInventoryChanges,{added:0,removed:0});
 assert.equal(report.currentBuildHasFindings,true);
 assert.equal(report.status,'REVIEW_AGGREGATE_REGRESSION');
 assert.equal(report.releaseStatus,'HOLD_EXTERNAL_AUTHORIZATION');
 assert.equal(report.customerDisplayAuthorized,false);
 assert.equal(report.publicationAuthorized,false);
 assert.deepEqual(report.previous,{pages:2,errors:0,warnings:0});
 assert.deepEqual(report.current,{pages:2,errors:2,warnings:1});
 assert.deepEqual(report.reviewIncreases,[
  {code:'repair_canonical',priority:'critical',previousCount:0,currentCount:1,increase:1},
  {code:'review_indexation',priority:'critical',previousCount:0,currentCount:1,increase:1},
  {code:'improve_internal_navigation',priority:'medium',previousCount:0,currentCount:1,increase:1}
 ]);
 assert.doesNotMatch(JSON.stringify(report),/PRIVATE-CUSTOMER|PRIVATE-NAME|servicos/);
});

test('F162 flags a new problem family even when total errors stay equal',()=>{
 const previous=audit(['missing_description']);
 const current=audit(['unexpected_noindex']);
 const report=run(previous,current);
 assert.equal(report.status,'REVIEW_AGGREGATE_REGRESSION');
 assert.deepEqual(report.reviewIncreases,[
  {code:'review_indexation',priority:'critical',previousCount:0,currentCount:1,increase:1}
 ]);
});

test('F162 does not invent a regression when both same-route audits have equal evidence',()=>{
 const report=run(audit(['wrong_canonical']),audit(['wrong_canonical']));
 assert.equal(report.status,'NO_NEW_AGGREGATE_FINDINGS_IN_SUPPLIED_AUDITS');
 assert.deepEqual(report.reviewIncreases,[]);
 assert.equal(report.currentBuildHasFindings,true,'F167: same defects are still blocking current build');
 assert.match(report.limitation,/unverified/);
});

test('F162 changed HTML route inventory is HOLD, not comparable or silently healthy',()=>{
 const report=run(audit(),audit(['unexpected_noindex'],[],['/','/contato/']));
 assert.equal(report.currentBuildHasFindings,true);
 assert.equal(report.routeCoverageComparable,false);
 assert.deepEqual(report.routeInventoryChanges,{added:1,removed:1});
 assert.equal(report.status,'HOLD_ROUTE_COVERAGE_CHANGED');
 assert.deepEqual(report.reviewIncreases,[]);
 assert.doesNotMatch(JSON.stringify(report),/contato|servicos/);
});

test('F162 fails closed on absent/forged route coverage and revision metadata',()=>{
 for(const previous of [
  {...audit(),routes:undefined},
  {...audit(),routes:[]},
  {...audit(),routes:['/','/']},
  {...audit(),routes:['/','/other?token=SECRET']},
  {...audit(),summary:{pages:0,errors:0,warnings:0}},
  {...audit(),summary:{pages:2,errors:1,warnings:0}}
 ])assert.throws(()=>run(previous,audit()),/route evidence|audit|coverage|pages/);
 for(const meta of [
  {previousRevision:currentRevision},
  {previousRevision:'deadbeef'},
  {currentRevision:'main'},
  {currentRevision:'SECRET-IDENTITY'}
 ])assert.throws(()=>run(audit(),audit(),meta),/distinct local source revisions/);
});

test('F162 CLI compares local JSON, never performs network calls, HOLD returns nonzero',()=>{
 const folder=mkdtempSync(join(tmpdir(),'seo-f162-'));
 const old=join(folder,'previous.json'),next=join(folder,'next.json');
 const cli=new URL('../scripts/compare-technical-audits-offline.mjs',import.meta.url).pathname;
 const invoke=(args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8'});
 try{
  writeFileSync(old,JSON.stringify(audit()));
  writeFileSync(next,JSON.stringify(audit()));
  const okay=invoke([old,next,previousRevision,currentRevision]);
  assert.equal(okay.status,0,okay.stderr);
  assert.equal(JSON.parse(okay.stdout).status,'NO_NEW_AGGREGATE_FINDINGS_IN_SUPPLIED_AUDITS');
  writeFileSync(next,JSON.stringify(audit(['unexpected_noindex'])));
  const regression=invoke([old,next,previousRevision,currentRevision]);
  assert.equal(regression.status,1);
  assert.equal(JSON.parse(regression.stdout).status,'REVIEW_AGGREGATE_REGRESSION');
  assert.doesNotMatch(regression.stdout,/PRIVATE-CUSTOMER|PRIVATE-NAME/);
  const invalid=invoke([old,next,previousRevision,'main']);
  assert.equal(invalid.status,1);
  assert.doesNotMatch(invalid.stderr,/PRIVATE-CUSTOMER|PRIVATE-NAME/);
  const usage=invoke([]);
  assert.equal(usage.status,2);
 }finally{rmSync(folder,{recursive:true,force:true})}
});
