import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {inspectCompleteGitDiffStatuses as review}
 from '../src/complete-git-diff-review.mjs';

const raw=s=>Buffer.from(s,'utf8');
test('F188 includes deleted security workflows and BOTH rename endpoints',()=>{
 const report=review(raw(
  'R100\0src/tenant-auth.mjs\0src/tenant-identity.mjs\0'+
  'D\0.github/workflows/production.yml\0'+
  'M\0src/seo-page.mjs\0'+
  'A\0tests/new.test.mjs\0'
 ));
 assert.equal(report.diffRecords,4);
 assert.equal(report.reviewedPathEndpoints,5);
 assert.equal(report.statusCounts.deleted,1);
 assert.equal(report.statusCounts.renamed,1);
 assert.equal(report.statusCounts.added,1);
 assert.equal(report.statusCounts.modified,1);
 assert.equal(report.riskGroups.ci_supply_chain,1);
 assert.equal(report.riskGroups.security_identity,2);
 assert.equal(report.criticalReviewPathEndpoints,3);
 assert.equal(report.deletedFilesIncluded,true);
 assert.equal(report.oldAndNewRenamePathsIncluded,true);
 for(const key of ['mergeAuthorized','deployAuthorized',
  'publicationAuthorized','networkPerformed'])
  assert.equal(report[key],false);
 assert.doesNotMatch(JSON.stringify(report),
  /tenant-auth|tenant-identity|production.yml/);
});
test('F188 rejects untrusted Git status, truncated rename and invalid source paths',()=>{
 for(const data of [
  '', 'D\0', 'R100\0src/old.js\0', 'Z\0x\0',
  'U\0auth.js\0','M\0../private\0','M\0src/.\\auth\0',
  'M\0x\nsecret\0','R100\0src/a\0src/a\0',
  'M\0src/a\0garbage',
 ])assert.throws(()=>review(raw(data)),/F188|F160/);
 assert.throws(()=>review(Buffer.from([0xff,0])),/F188/);
 assert.throws(()=>review(Buffer.alloc(4*1024*1024+1)),/F188/);
});
test('F188 processes actual Git HEAD diff with deletion and rename, no simulation of statuses',()=>{
 const dir=mkdtempSync(join(tmpdir(),'seo-f188-git-'));
 const git=(args)=>execFileSync('git',args,{cwd:dir,encoding:'buffer'});
 try{
  git(['init','-q']);
  git(['config','user.name','Imagine QA']);
  git(['config','user.email','qa@example.invalid']);
  mkdirSync(join(dir,'.github/workflows'),{recursive:true});
  mkdirSync(join(dir,'src'),{recursive:true});
  writeFileSync(join(dir,'.github/workflows/old-deploy.yml'),'name: old\n');
  writeFileSync(join(dir,'src/tenant-auth.mjs'),'export const secure = true;\n');
  git(['add','.']);
  git(['commit','-qm','baseline']);
  const base=git(['rev-parse','HEAD']).toString('utf8').trim();
  git(['rm','-q','.github/workflows/old-deploy.yml']);
  git(['mv','src/tenant-auth.mjs','src/tenant-identity.mjs']);
  git(['commit','-qm','remove old deploy and rename security boundary']);
  const diff=git(['diff','--name-status','-z','--find-renames=50%',
    '--diff-filter=ACDMRT',base,'HEAD']);
  const result=review(diff);
  assert.equal(result.diffRecords,2);
  assert.equal(result.reviewedPathEndpoints,3);
  assert.equal(result.statusCounts.deleted,1);
  assert.equal(result.statusCounts.renamed,1);
  assert.equal(result.criticalReviewPathEndpoints,3);
  assert.equal(result.publicationAuthorized,false);
 }finally{rmSync(dir,{recursive:true,force:true})}
});
