/**
 * SEO F147 — fail-closed, OFFLINE and privacy-redacted Docker staging
 * isolation review against a snapshot supplied by an operator.
 * Never claims the snapshot was authenticated, reserves a port, nor deploys.
 */
const LABEL=/^[a-z][a-z0-9_.-]{1,62}$/;
const MAX_ITEMS=5000;
function exact(v,fields){
  if(v===null||typeof v!=='object'||Array.isArray(v)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(v)))return false;
  const own=Reflect.ownKeys(v);
  return own.length===fields.length&&own.every(k=>{
    if(typeof k!=='string'||!fields.includes(k))return false;
    const d=Object.getOwnPropertyDescriptor(v,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function dense(values,max=MAX_ITEMS){
  if(!Array.isArray(values)||Object.getPrototypeOf(values)!==Array.prototype||
     values.length>max||Reflect.ownKeys(values).length!==values.length+1)
    return false;
  for(let i=0;i<values.length;i++){
    const d=Object.getOwnPropertyDescriptor(values,String(i));
    if(!d?.enumerable||!Object.hasOwn(d,'value'))return false;
  }
  return true;
}
function names(values){
  if(!dense(values)||values.some(x=>typeof x!=='string'||
     x.length>120||x.length<1||/[\x00-\x1f\x7f]/.test(x)))
    throw Error('SEO F147: invalid container/volume/network names');
  return new Set(values);
}
function ports(values){
  if(!dense(values)||values.some(x=>!Number.isSafeInteger(x)||
     x<1||x>65535))
    throw Error('SEO F147: invalid bounded listener snapshot');
  return new Set(values);
}
export function reviewIsolatedSeoStagingInventory(input){
  if(!exact(input,['sourceType','requested','host','existing'])||
     input.sourceType!=='operator_supplied_docker_host_inventory_unverified'||
     !exact(input.requested,[
       'composeProject','networkName','volumeName','loopbackPort',
       'memoryLimitMiB','cpuLimit'
     ])||
     !exact(input.host,['availableMemoryMiB','totalCpu','snapshotComplete'])||
     !exact(input.existing,[
       'containerNames','networkNames','volumeNames',
       'listeningPorts','publishedPorts'
     ]))
    throw Error('SEO F147: exact operator inventory required');
  const {requested:q,host:h,existing:e}=input;
  if(![q.composeProject,q.networkName,q.volumeName].every(x=>
      typeof x==='string'&&LABEL.test(x))||
     !Number.isSafeInteger(q.loopbackPort)||q.loopbackPort<1024||
     q.loopbackPort>65535||
     !Number.isSafeInteger(q.memoryLimitMiB)||
     q.memoryLimitMiB<128||q.memoryLimitMiB>4096||
     !Number.isSafeInteger(q.cpuLimit)||q.cpuLimit<1||q.cpuLimit>4||
     !Number.isSafeInteger(h.availableMemoryMiB)||
     h.availableMemoryMiB<0||h.availableMemoryMiB>1024*1024||
     !Number.isSafeInteger(h.totalCpu)||h.totalCpu<1||h.totalCpu>512||
     typeof h.snapshotComplete!=='boolean')
    throw Error('SEO F147: impossible or unbounded staging resources');

  const containers=names(e.containerNames);
  const networks=names(e.networkNames);
  const volumes=names(e.volumeNames);
  const bound=ports(e.listeningPorts);
  const published=ports(e.publishedPorts);
  const reasons=[];
  // Existing CRM listener is reserved even if an operator inventory is stale.
  if(q.loopbackPort===18081||bound.has(q.loopbackPort)||
     published.has(q.loopbackPort))
    reasons.push('selected_port_reserved_or_already_in_use');
  if(containers.has(q.composeProject)||
     [...containers].some(n=>n.startsWith(q.composeProject+'-')||
       n.startsWith(q.composeProject+'_')))
    reasons.push('compose_project_container_namespace_collision');
  if(networks.has(q.networkName))
    reasons.push('network_namespace_collision');
  if(volumes.has(q.volumeName))
    reasons.push('volume_namespace_collision');
  if(q.networkName===q.volumeName||
     [q.networkName,q.volumeName].includes(q.composeProject))
    reasons.push('staging_identifiers_not_separated');
  if(h.availableMemoryMiB-q.memoryLimitMiB<4096||
     q.memoryLimitMiB*2>h.availableMemoryMiB)
    reasons.push('host_memory_reserve_insufficient');
  if(q.cpuLimit>Math.floor(h.totalCpu/2))
    reasons.push('host_cpu_reserve_insufficient');
  if(!h.snapshotComplete)
    reasons.push('operator_inventory_marked_incomplete');
  return {
    contractVersion:'seo-f147-isolated-compose-inventory-offline-v1',
    reviewStatus:reasons.length?'blocked':'human_host_inventory_review_required',
    blockedComponents:reasons,
    summary:{
      existingContainerCount:e.containerNames.length,
      existingNetworkCount:e.networkNames.length,
      existingVolumeCount:e.volumeNames.length,
      listeningPortCount:e.listeningPorts.length,
      publishedPortCount:e.publishedPorts.length,
      uniqueListenerCount:new Set([...bound,...published]).size,
      conservativeMemoryReserveMiB:Math.max(0,
        h.availableMemoryMiB-q.memoryLimitMiB),
      requestedCpuLimit:q.cpuLimit,
      requestedMemoryLimitMiB:q.memoryLimitMiB,
      singleLoopbackPortSelected:true,
      hostInventoryCompleteAsClaimed:h.snapshotComplete
    },
    sourceAuthenticated:false,
    actualPortReserved:false,
    existingServicesPreservedByThisReview:true,
    dockerCommandsPerformed:false,
    composeProjectCreated:false,
    vpsChangesApplied:false,
    publicNetworkReached:false,
    deploymentAuthorized:false,
    releaseStatus:'HOLD_REAL_VPS_INVENTORY_BACKUP_RESTORE_AND_APPROVAL'
  };
}
