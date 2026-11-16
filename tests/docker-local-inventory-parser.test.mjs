import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseNameLines,parseSocketListeners,parseDockerPublishedPorts,
  parseLinuxAvailableMemory,buildReadOnlyDockerInventory
} from '../labs/seo-f148-docker-host/parse-readonly-inventory.mjs';

const raw=()=>({
  requested:{
    composeProject:'seo-f148-stage',networkName:'seo-f148-stage-net',
    volumeName:'seo-f148-stage-vol',loopbackPort:18293,
    memoryLimitMiB:512,cpuLimit:1
  },
  contextEndpoint:'unix:///var/run/docker.sock',
  containers:'crm-private-web\nsites-private-web\n',
  networks:'bridge\ncrm-private-net\nsites-private-net\n',
  volumes:'crm-private-volume\nsites-private-volume\n',
  listeners:'LISTEN 0 128 127.0.0.1:18081 0.0.0.0:*\n'+
    'LISTEN 0 512 [::]:443 [::]:*\n',
  published:'127.0.0.1:18081->8080/tcp, [::]:18081->8080/tcp\n'+
    '5432/tcp\n',
  meminfo:'MemTotal: 24000000 kB\nMemAvailable: 16000000 kB\n',
  totalCpu:8
});
test('F148 parses Linux tcp sockets and Docker publishes without false positives',()=>{
 assert.deepEqual(parseSocketListeners(raw().listeners),[18081,443]);
 assert.deepEqual(parseDockerPublishedPorts(raw().published),[18081]);
 assert.deepEqual(parseNameLines('crm-1\ncrm-1\nseo-1\n'),['crm-1','seo-1']);
 assert.equal(parseLinuxAvailableMemory(raw().meminfo),15625);
 assert.deepEqual(parseNameLines(''),[]);
});
test('F148 preserves private host snapshot but only publishes sanitized review',()=>{
 const out=buildReadOnlyDockerInventory(raw());
 assert.equal(out.privateInventory.existing.containerNames.length,2);
 assert.equal(out.privateInventory.host.availableMemoryMiB,15625);
 assert.equal(out.report.reviewStatus,'human_host_inventory_review_required');
 assert.equal(out.report.actualPortReserved,false);
 assert.equal(out.report.vpsChangesApplied,false);
 assert.doesNotMatch(JSON.stringify(out.report),/crm-private|sites-private|18293|18081/);
});
test('F148 refuses remote Docker endpoint and incomplete listener output',()=>{
 const remote=raw();
 remote.contextEndpoint='ssh://operator@vps.example.test';
 assert.throws(()=>buildReadOnlyDockerInventory(remote),/SEO F148/);
 const tcp=raw();tcp.contextEndpoint='tcp://127.0.0.1:2375';
 assert.throws(()=>buildReadOnlyDockerInventory(tcp),/SEO F148/);
 assert.throws(()=>parseSocketListeners(
   'LISTEN 0 128 badport 0.0.0.0:*'),/SEO F148/);
 assert.throws(()=>parseDockerPublishedPorts(
   '127.0.0.1:secure->8080/tcp'),/SEO F148/);
 assert.throws(()=>parseLinuxAvailableMemory('MemFree: 200 kB'),/SEO F148/);
});
test('F148 records other live ports and fails closed on collisions',()=>{
 const obs=raw();
 obs.requested.loopbackPort=18081;
 const out=buildReadOnlyDockerInventory(obs);
 assert.equal(out.report.reviewStatus,'blocked');
 assert.ok(out.report.blockedComponents.includes(
   'selected_port_reserved_or_already_in_use'
 ));
 assert.doesNotMatch(JSON.stringify(out.report),/crm-private|127.0.0.1/);
});
test('F148 rejects getter payloads, unsafe text and excess lines',()=>{
 const bad=raw();
 Object.defineProperty(bad,'containers',{
   enumerable:true,get(){throw Error('PRIVATE')}});
 assert.throws(()=>buildReadOnlyDockerInventory(bad),/SEO F148/);
 assert.throws(()=>parseNameLines('bad\nother\nhi\rbye'),/SEO F148/);
 assert.throws(()=>parseNameLines('a\n'.repeat(5002)),/SEO F148/);
});
