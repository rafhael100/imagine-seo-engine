import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectWorkflowSource as inspect,summarizeWorkflowSupplyChain as summary}
 from '../src/workflow-supply-chain-review.mjs';
test('F161 accepts SHA-pinned actions and read-only permission without granting release',()=>{
 const s='name: Safe\non:\n  pull_request:\npermissions:\n  contents: read\nsteps:\n  - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7\n';
 const x=inspect('safe.yml',s);
 assert.equal(x.usesCount,1);
 assert.equal(x.findings.length,0);
 const report=summary([x]);
 assert.equal(report.reviewedWorkflows,1);
 assert.equal(report.findings,0);
 assert.equal(report.releaseStatus,'HOLD_INDEPENDENT_REVIEW');
 assert.equal(report.publicationAuthorized,false);
 assert.equal(report.mergeAuthorized,false);
 assert.equal(report.deployAuthorized,false);
});
test('F161 flags privileged events, unpinned actions and credentials',()=>{
 const x=inspect('danger.yml',[
 'on:',
 '  pull_request_target:',
 'permissions: write-all',
 'jobs:',
 '  test:',
 '    steps:',
 '      - uses: actions/checkout@v4',
 '        with:',
 '          persist-credentials: true',
 '      - uses: ./external',
 '      - uses: docker://alpine:latest'
 ].join('\n'));
 const codes=x.findings.map(v=>v.rule);
 for(const code of ['privileged_event_review','write_permission_review',
  'persisted_checkout_credentials','unpinned_or_ambiguous_action'])
  assert.ok(codes.includes(code));
 assert.equal(x.hardBlockerCount>=3,true);
 assert.equal(summary([x]).releaseStatus,'HOLD_WORKFLOW_FINDINGS_AND_INDEPENDENT_REVIEW');
});
test('F161 rejects malformed, duplicate and forged aggregate inputs',()=>{
 assert.throws(()=>inspect('../oops.yml','x'),/F161/);
 assert.throws(()=>inspect('a.yml',''),/F161/);
 assert.throws(()=>summary([]),/F161/);
 assert.throws(()=>summary([inspect('a.yml','name: A'),inspect('a.yml','name: A')]),/F161/);
 assert.throws(()=>summary([{workflow:'a.yml',usesCount:0,findings:[{rule:'approved'}]}]),/F161/);
});

test('F163 rejects compact privileged event and inline write permissions',()=>{
 const sample=[
  'name: Dangerous',
  'on: [push, pull_request_target]',
  'permissions: {contents: write, pull-requests: read}',
  'jobs:',
  '  check:',
  '    steps:',
  '      - uses: actions/checkout@v4'
 ].join('\n');
 const x=inspect('inline.yml',sample);
 const rules=x.findings.map(y=>y.rule);
 assert.ok(rules.includes('privileged_event_review'));
 assert.ok(rules.includes('write_permission_review'));
 assert.ok(rules.includes('unpinned_or_ambiguous_action'));
});
test('F163 refuses omitted permissions instead of trusting GitHub defaults',()=>{
 const x=inspect('missing.yml',
  'name: missing\non: [pull_request]\njobs:\n  check:\n    steps:\n      - run: echo safe\n');
 assert.ok(x.findings.some(y=>y.rule==='missing_explicit_permissions'));
 assert.equal(summary([x]).releaseStatus,'HOLD_WORKFLOW_FINDINGS_AND_INDEPENDENT_REVIEW');
});
test('F163 quoted SHA pin is not mislabeled as moving action tag',()=>{
 const x=inspect('quoted.yaml',
  'permissions:\n  contents: read\nsteps:\n  - uses: "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1"\n');
 assert.equal(x.usesCount,1);
 assert.deepEqual(x.findings,[]);
});
