import test from 'node:test';
import assert from 'node:assert/strict';
import {compareStaticAuditReports} from '../src/audit-regression.mjs';
const issue=(type,file,message='Sensitive URL or content must never be emitted')=>({type,file,message});
const report=(pages,errors=[],warnings=[])=>({
  summary:{pages,errors:errors.length,warnings:warnings.length},
  errors,warnings
});
test('does not block identical clean builds',()=>{
  const result=compareStaticAuditReports(report(15),report(15));
  assert.equal(result.passed,true);
  assert.equal(result.changes.newErrors,0);
});
test('fails when new errors or warnings appear and omits free-text messages',()=>{
  const result=compareStaticAuditReports(report(15),report(15,
    [issue('wrong_canonical','index.html')],[issue('orphan_page','blog/index.html')]));
  assert.equal(result.passed,false);
  assert.equal(result.changes.newErrors,1);
  assert.equal(result.changes.newWarnings,1);
  assert.deepEqual(result.introduced[0],{severity:'error',type:'wrong_canonical',file:'index.html'});
  assert.doesNotMatch(JSON.stringify(result),/Sensitive URL or content/);
});
test('detects page disappearance even with no SEO errors',()=>{
  const result=compareStaticAuditReports(report(15),report(13));
  assert.equal(result.passed,false);
  assert.equal(result.changes.removedPageCount,2);
  assert.equal(compareStaticAuditReports(report(15),report(13),{blockPageLoss:false}).passed,true);
});
test('allows explicitly configured warn-only gate without changing defaults',()=>{
  const before=report(15);
  const current=report(15,[],[issue('missing_jsonld','servicos/index.html')]);
  assert.equal(compareStaticAuditReports(before,current).passed,false);
  assert.equal(compareStaticAuditReports(before,current,{maxWarnings:1,maxNewWarnings:1}).passed,true);
});
test('reports resolved issues without repeating private messages',()=>{
  const result=compareStaticAuditReports(report(2,[issue('broken_internal_link','index.html')]),report(2));
  assert.equal(result.changes.resolvedIssues,1);
  assert.deepEqual(result.resolved,[{severity:'error',type:'broken_internal_link',file:'index.html'}]);
});
test('rejects altered counts, unsafe paths, invalid policies and missing reports',()=>{
  assert.throws(()=>compareStaticAuditReports(report(1),{
    summary:{pages:1,errors:4,warnings:0},errors:[],warnings:[]
  }),/inconsistent summary/);
  assert.throws(()=>compareStaticAuditReports(report(1),report(1,
    [issue('broken_internal_link','../secrets')])) ,/invalid issue identifier/);
  assert.throws(()=>compareStaticAuditReports(report(1),report(1),{maxErrors:-1}),/invalid policy/);
  assert.throws(()=>compareStaticAuditReports(null,report(1)),/structured audit report/);
});

test('blocks replacing a route with a different URL even when page count is unchanged',()=>{
  const before={...report(2),routes:['/','/servicos/']};
  const after={...report(2),routes:['/','/promocoes/']};
  const result=compareStaticAuditReports(before,after);
  assert.equal(result.passed,false);
  assert.equal(result.changes.removedPageCount,0);
  assert.deepEqual(result.removedRoutes,['/servicos/']);
  assert.deepEqual(result.addedRoutes,['/promocoes/']);
  assert.equal(result.changes.routeInventoryCompared,true);
  assert.equal(compareStaticAuditReports(before,after,{blockRouteLoss:false}).passed,true);
});
test('fails closed when current report drops a previously present route inventory',()=>{
  const before={...report(1),routes:['/']};
  const result=compareStaticAuditReports(before,report(1));
  assert.equal(result.passed,false);
  assert.equal(result.changes.routeInventoryRegressed,true);
  assert.equal(compareStaticAuditReports(report(1),report(1)).passed,true);
});
test('rejects manipulated route inventories and illegal route names',()=>{
  assert.throws(()=>compareStaticAuditReports(report(2),{...report(2),routes:['/']}),/invalid route inventory/);
  assert.throws(()=>compareStaticAuditReports(report(2),{...report(2),routes:['/','/']}),/duplicate routes/);
  assert.throws(()=>compareStaticAuditReports(report(1),{...report(1),routes:['/../private']}),/invalid route inventory/);
  assert.throws(()=>compareStaticAuditReports(report(1),{...report(1),routes:['/index?secret=1']}),/invalid route inventory/);
});
