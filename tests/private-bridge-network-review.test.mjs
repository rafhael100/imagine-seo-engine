import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewInternalStagingDockerNetwork as review}
 from '../src/private-bridge-network-review.mjs';

const id='a'.repeat(64);
const good=()=>({
 inspect:{
  Name:'seo-f197-ciunit-net',Driver:'bridge',Scope:'local',
  Internal:true,Attachable:false,Ingress:false,EnableIPv6:false,
  Containers:{[id]:{Name:'nginx-test-only',IPv4Address:'172.20.0.2/16'}}
 },
 expectedNetworkName:'seo-f197-ciunit-net',containerId:id
});
test('F198 verifies Docker internal bridge with exactly one expected container',()=>{
 const x=review(good());
 assert.equal(x.actualDockerNetworkInspectReviewed,true);
 assert.equal(x.dockerInternalNetworkFlagObserved,true);
 assert.equal(x.exactExpectedSingleContainerObserved,true);
 assert.equal(x.livePacketEgressTestPerformed,false);
 assert.equal(x.remoteHostOrVpsAuthenticated,false);
 assert.equal(x.releaseAuthorized,false);
 assert.doesNotMatch(JSON.stringify(x),/172\.20|nginx-test-only|seo-f197-ciunit-net|aaaa/);
});
test('F198 refuses non-internal bridge even if loopback port looks safe',()=>{
 const x=good();x.inspect.Internal=false;
 assert.throws(()=>review(x),/F198/);
});
test('F198 rejects public attachability, IPv6, foreign bridge and host scope',()=>{
 for(const [key,value] of [
  ['Attachable',true],['EnableIPv6',true],['Ingress',true],
  ['Scope','swarm'],['Driver','host'],['Name','crm-production']
 ]){
  const x=good();x.inspect[key]=value;
  assert.throws(()=>review(x),/F198/,key);
 }
});
test('F198 refuses a second network participant and forged container ID',()=>{
 const x=good();x.inspect.Containers['b'.repeat(64)]={Name:'crm-do-not-touch'};
 assert.throws(()=>review(x),/F198/);
 const y=good();y.containerId='b'.repeat(64);
 assert.throws(()=>review(y),/F198/);
});
test('F198 rejects caller-provided approval flags or accessor at boundary',()=>{
 const x=good();x.deploymentAuthorized=true;
 assert.throws(()=>review(x),/F198/);
 const y=good();Object.defineProperty(y,'inspect',{get(){throw Error('accessor leaked')}});
 assert.throws(()=>review(y),/F198/);
});
