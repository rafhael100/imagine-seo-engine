import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewIsolatedSeoStagingInventory as review} from
  '../src/staging-compose-isolation-review.mjs';

const inventory=()=>({
  sourceType:'operator_supplied_docker_host_inventory_unverified',
  requested:{
    composeProject:'seo-f147-private-staging',
    networkName:'seo-f147-network',
    volumeName:'seo-f147-storage',
    loopbackPort:18291,memoryLimitMiB:512,cpuLimit:1
  },
  host:{availableMemoryMiB:14000,totalCpu:8,snapshotComplete:true},
  existing:{
    containerNames:['imagine-crm-web','imagine-sites-preview'],
    networkNames:['crm-net','sites-net'],
    volumeNames:['crm-pg','sites-content'],
    listeningPorts:[18081,18082,5432],
    publishedPorts:[18081,18082]
  }
});
test('F147 permits human review only for independent capacity and namespaces',()=>{
 const out=review(inventory());
 assert.equal(out.reviewStatus,'human_host_inventory_review_required');
 assert.deepEqual(out.blockedComponents,[]);
 assert.equal(out.summary.existingContainerCount,2);
 assert.equal(out.summary.conservativeMemoryReserveMiB,13488);
 assert.equal(out.summary.uniqueListenerCount,3);
 assert.equal(out.sourceAuthenticated,false);
 assert.equal(out.actualPortReserved,false);
 assert.equal(out.composeProjectCreated,false);
 assert.equal(out.vpsChangesApplied,false);
 assert.equal(out.deploymentAuthorized,false);
 const serialized=JSON.stringify(out);
 for(const name of ['imagine-crm','imagine-sites','crm-pg',
   'crm-net','18291','18081'])
  assert.equal(serialized.includes(name),false,name);
});
test('F147 blocks observed port conflict and explicit reserved CRM port',()=>{
 const used=inventory();used.requested.loopbackPort=18082;
 assert.deepEqual(review(used).blockedComponents,
   ['selected_port_reserved_or_already_in_use']);
 const reserved=inventory();reserved.requested.loopbackPort=18081;
 reserved.existing.listeningPorts=[];
 reserved.existing.publishedPorts=[];
 assert.deepEqual(review(reserved).blockedComponents,
   ['selected_port_reserved_or_already_in_use']);
});
test('F147 blocks Docker compose, network and persistent volume collisions',()=>{
 const payload=inventory();
 payload.existing.containerNames.push('seo-f147-private-staging-web-1');
 payload.existing.networkNames.push('seo-f147-network');
 payload.existing.volumeNames.push('seo-f147-storage');
 const out=review(payload);
 assert.equal(out.reviewStatus,'blocked');
 assert.deepEqual(out.blockedComponents,[
  'compose_project_container_namespace_collision',
  'network_namespace_collision','volume_namespace_collision'
 ]);
 assert.doesNotMatch(JSON.stringify(out),/private-staging|seo-f147-network|crm-pg/);
});
test('F147 blocks insufficient free memory/cpu and incomplete inventory',()=>{
 const payload=inventory();
 payload.host.availableMemoryMiB=4300;
 payload.host.totalCpu=1;
 payload.host.snapshotComplete=false;
 const result=review(payload);
 assert.deepEqual(result.blockedComponents,[
  'host_memory_reserve_insufficient',
  'host_cpu_reserve_insufficient',
  'operator_inventory_marked_incomplete'
 ]);
 assert.equal(result.reviewStatus,'blocked');
});
test('F147 rejects malformed numbers, getters, arrays and privileged fields',()=>{
 const wrongPort=inventory();wrongPort.requested.loopbackPort='18291';
 assert.throws(()=>review(wrongPort),/SEO F147/);
 const wrongHost=inventory();wrongHost.host.availableMemoryMiB=-1;
 assert.throws(()=>review(wrongHost),/SEO F147/);
 const extra=inventory();extra.deploy=true;
 assert.throws(()=>review(extra),/SEO F147/);
 const getter=inventory();
 Object.defineProperty(getter.requested,'memoryLimitMiB',{
  enumerable:true,get(){throw Error('PRIVATE SOURCE')}}
 );
 assert.throws(()=>review(getter),/SEO F147/);
 const sparse=inventory();
 sparse.existing.listeningPorts=Array(3);
 sparse.existing.listeningPorts[0]=18081;
 assert.throws(()=>review(sparse),/SEO F147/);
 const names=inventory();names.existing.containerNames[0]='private\ncredential';
 assert.throws(()=>review(names),/SEO F147/);
});
