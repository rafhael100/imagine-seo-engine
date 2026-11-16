/** F161: fail-closed static review of GitHub Actions source, no YAML execution. */
const remote=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.\/-]+@[a-f0-9]{40}$/;
const docker=/^docker:\/\/[^\s]+@sha256:[a-f0-9]{64}$/;
const local=/^\.\/\.github\/actions\/[A-Za-z0-9_.\/-]+$/;
export function inspectWorkflowSource(name,source){
 if(typeof name!=='string'||!/^[a-z0-9][a-z0-9.-]*\.ya?ml$/.test(name)||
  typeof source!=='string'||!source.trim())throw Error('F161: valid workflow source required');
 const findings=[],lines=source.split(/\r?\n/);
 let usesCount=0;
 for(let i=0;i<lines.length;i++){
  const row=lines[i].trim();
  if(!row||row.startsWith('#'))continue;
  if(/^pull_request_target\s*:/.test(row)||/^workflow_run\s*:/.test(row))
   findings.push({line:i+1,rule:'privileged_event_review'});
  if(/^persist-credentials\s*:\s*true(?:\s|$)/i.test(row))
   findings.push({line:i+1,rule:'persisted_checkout_credentials'});
  if(/^permissions\s*:\s*write-all(?:\s|$)/i.test(row)||
     /^[a-z-]+\s*:\s*write(?:\s|$)/i.test(row))
   findings.push({line:i+1,rule:'write_permission_review'});
  const m=row.match(/^-?\s*uses\s*:\s*([^\s#]+)/);
  if(m){
   usesCount++;
   if(!remote.test(m[1])&&!docker.test(m[1])&&!local.test(m[1]))
    findings.push({line:i+1,rule:'unpinned_or_ambiguous_action'});
  }
 }
 return Object.freeze({
  workflow:name,usesCount,findings:Object.freeze(findings.map(x=>Object.freeze(x))),
  hardBlockerCount:findings.filter(x=>x.rule!=='write_permission_review').length
 });
}
export function summarizeWorkflowSupplyChain(results){
 if(!Array.isArray(results)||!results.length)throw Error('F161: workflow inventory missing');
 const unique=new Set(),rules={};let actions=0;
 for(const item of results){
  if(!item||typeof item.workflow!=='string'||unique.has(item.workflow)||
     !Number.isSafeInteger(item.usesCount)||item.usesCount<0||
     !Array.isArray(item.findings))throw Error('F161: malformed or duplicated workflow result');
  unique.add(item.workflow);actions+=item.usesCount;
  for(const finding of item.findings){
   if(!['privileged_event_review','persisted_checkout_credentials','write_permission_review',
      'unpinned_or_ambiguous_action'].includes(finding.rule))throw Error('F161: unknown security finding');
   rules[finding.rule]=(rules[finding.rule]??0)+1;
  }
 }
 const findings=Object.values(rules).reduce((a,b)=>a+b,0);
 return Object.freeze({
  contractVersion:'seo-f161-github-actions-review-v1',
  reviewedWorkflows:results.length,actionReferences:actions,
  findingCounts:Object.freeze(rules),findings,
  independentReviewRequired:true,
  publicationAuthorized:false,deployAuthorized:false,mergeAuthorized:false,
  releaseStatus:findings?'HOLD_WORKFLOW_FINDINGS_AND_INDEPENDENT_REVIEW':'HOLD_INDEPENDENT_REVIEW'
 });
}
