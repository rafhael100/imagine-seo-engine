import test from 'node:test';
import assert from 'node:assert/strict';
import {makeCiOnlyMemoryDriftFixture as drift} from
  '../labs/seo-f152-adversarial-runtime/memory-drift-ci-only.mjs';
import {reviewRunningStagingContainer as audit} from
  '../labs/seo-f151-docker-runtime/audit-running-container.mjs';

const HEAD='nginx:1.29.5-alpine@sha256:1eff5a5f3fcf8431a0abb7eddf5471fec24e5e1905a2581aeacdb07a4479b92b';
const compose=()=>[
 '# SEO F149 — PRIVATE STAGING ONLY. NO production deploy.',
 'services:',
 '  nginx:',
 '    image: '+HEAD,
 '    read_only: true',
 '    cap_drop: ["ALL"]',
 '    security_opt: ["no-new-privileges:true"]',
 '    mem_limit: "512m"',
 '    cpus: "1"',
 '    restart: "no"',
 '    ports: ["127.0.0.1:18297:8080"]',
 ''
].join('\n');
test('F152 changes only one CPU-safe disposable memory field',()=>{
 const base=compose(),altered=drift(base);
 assert.equal(altered,base.replace('    mem_limit: "512m"',
   '    mem_limit: "768m"'));
 assert.ok(altered.includes('ports: ["127.0.0.1:18297:8080"]'));
 assert.ok(altered.includes('read_only: true'));
 assert.ok(altered.includes('no-new-privileges:true'));
 assert.ok(altered.includes('restart: "no"'));
 assert.equal(base.includes('768m'),false);
});
test('F152 refuses unsupported or already modified baseline',()=>{
 assert.throws(()=>drift(compose().replace('512m','768m')),/SEO F152/);
 assert.throws(()=>drift(compose().replace('127.0.0.1','0.0.0.0')),
   /SEO F152/);
 assert.throws(()=>drift(compose().replace('read_only: true',
   'read_only: false')),/SEO F152/);
 assert.throws(()=>drift(compose().replace('cap_drop: ["ALL"]',
   'cap_drop: []')),/SEO F152/);
 assert.throws(()=>drift(compose().replace('mem_limit: "512m"',
   'mem_limit: "512m"\n    mem_limit: "512m"')),/SEO F152/);
 assert.throws(()=>drift({}),/SEO F152/);
});
