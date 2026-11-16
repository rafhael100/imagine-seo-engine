/**
 * SEO F198 — verify REAL Docker daemon network inspect in an isolated CI.
 * No Docker CLI in src/; network/containers/IPs never appear in the result.
 * A successful "internal" flag is not a live packet-egress test or VPN/TLS.
 */
const HEX=/^[a-f0-9]{12,64}$/;
const NAME=/^seo-f(?:149|150|197)-[a-z0-9_.-]{2,90}$/;
const exact=(x,fields)=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
 [Object.prototype,null].includes(Object.getPrototypeOf(x))&&
 Reflect.ownKeys(x).length===fields.length&&
 fields.every(k=>{
  const d=Object.getOwnPropertyDescriptor(x,k);
  return d?.enumerable===true&&Object.hasOwn(d,'value');
 });
export function reviewInternalStagingDockerNetwork(input){
 if(!exact(input,['inspect','expectedNetworkName','containerId'])||
    typeof input.expectedNetworkName!=='string'||
    !NAME.test(input.expectedNetworkName)||
    typeof input.containerId!=='string'||!HEX.test(input.containerId))
  throw Error('SEO F198: exact isolated network review required');
 const network=input.inspect;
 if(!network||typeof network!=='object'||Array.isArray(network)||
    typeof network.Name!=='string'||network.Name!==input.expectedNetworkName||
    network.Driver!=='bridge'||network.Scope!=='local'||
    network.Internal!==true||network.Attachable!==false||
    network.Ingress!==false||network.EnableIPv6!==false||
    !network.Containers||typeof network.Containers!=='object'||
    Array.isArray(network.Containers))
  throw Error('SEO F198: Docker network missing isolation controls');
 const ids=Object.keys(network.Containers);
 if(ids.length!==1||!HEX.test(ids[0])||
    ids[0]!==input.containerId||
    typeof network.Containers[ids[0]]!=='object'||
    network.Containers[ids[0]]===null)
  throw Error('SEO F198: network has wrong or additional containers');
 return Object.freeze({
  contractVersion:'seo-f198-real-docker-internal-network-inspect-v1',
  actualDockerNetworkInspectReviewed:true,
  dedicatedBridgeNetworkObserved:true,
  dockerInternalNetworkFlagObserved:true,
  dockerNetworkAttachable:false,
  ipv6Enabled:false,
  exactExpectedSingleContainerObserved:true,
  networkIdsOrAddressesExposed:false,
  livePacketEgressTestPerformed:false,
  publicIngressVerified:false,
  remoteHostOrVpsAuthenticated:false,
  releaseAuthorized:false,
  deploymentAuthorized:false,
  publicationAuthorized:false,
  releaseStatus:'HOLD_INDEPENDENT_NETWORK_SECURITY_TLS_AND_HUMAN_APPROVAL'
 });
}
