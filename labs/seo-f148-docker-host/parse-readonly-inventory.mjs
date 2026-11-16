/**
 * SEO F148 — parse a local Docker/OS inventory captured by an operator
 * WITHOUT a shell, remote Docker endpoint, credentials or container inspect.
 *
 * Outputs are PRIVATE. A separate offline F147 evaluator only emits counts.
 */
import {reviewIsolatedSeoStagingInventory} from
  '../../src/staging-compose-isolation-review.mjs';

const MAX_LINES=5000;
function fail(){throw Error('SEO F148: incomplete or ambiguous Docker host inventory');}
export function parseNameLines(raw){
  if(typeof raw!=='string'||raw.length>1024*1024)fail();
  if(raw===''||raw==='\n')return [];
  const items=raw.trimEnd().split('\n');
  if(items.length>MAX_LINES)fail();
  if(items.some(s=>s.length<1||s.length>120||
     /[\x00-\x1f\x7f]/.test(s)))fail();
  return [...new Set(items)];
}
export function parseSocketListeners(raw){
  if(typeof raw!=='string'||raw.length>1024*1024)fail();
  const text=raw.trim();
  if(!text)return [];
  const lines=text.split('\n');
  if(lines.length>MAX_LINES)fail();
  const ports=[];
  for(const line of lines){
    const columns=line.trim().split(/\s+/);
    // ss -H -lnt: State Recv-Q Send-Q LocalAddress:Port PeerAddress:Port
    const match=columns[3]?.match(/:(\d{1,5})$/);
    if(columns.length<5||!match)fail();
    const port=Number(match[1]);
    if(port<1||port>65535)fail();
    ports.push(port);
  }
  return [...new Set(ports)];
}
export function parseDockerPublishedPorts(raw){
  if(typeof raw!=='string'||raw.length>1024*1024)fail();
  if(!raw.trim())return [];
  const entries=raw.trimEnd().split('\n');
  if(entries.length>MAX_LINES)fail();
  const published=[];
  for(const field of entries){
    for(const part of field.split(',')){
      const s=part.trim();
      if(!s)continue;
      // Non-published internal port declarations are intentionally ignored.
      if(!s.includes('->'))continue;
      const match=s.match(/:(\d{1,5})->\d{1,5}\/(?:tcp|udp)$/);
      if(!match)fail();
      const port=Number(match[1]);
      if(port<1||port>65535)fail();
      published.push(port);
    }
  }
  return [...new Set(published)];
}
export function parseLinuxAvailableMemory(raw){
  if(typeof raw!=='string'||raw.length>1024*1024)fail();
  const matches=[...raw.matchAll(/^MemAvailable:\s+(\d+)\s+kB$/gm)];
  if(matches.length!==1)fail();
  const kib=Number(matches[0][1]);
  if(!Number.isSafeInteger(kib)||kib<0||
     kib>1024*1024*1024)fail();
  return Math.floor(kib/1024);
}
export function assertLocalDockerUnixContext(endpoint){
  // This must be called by the collector BEFORE any ls/ps commands.
  if(typeof endpoint!=='string'||
     !/^unix:\/\/[\w/.-]+\.sock$/.test(endpoint)||
     endpoint.includes('..')||!endpoint.startsWith('unix:///'))
    fail();
  return true;
}
export function buildReadOnlyDockerInventory(input){
  const needed=['requested','contextEndpoint','containers','networks',
    'volumes','listeners','published','meminfo','totalCpu'];
  if(!input||typeof input!=='object'||Array.isArray(input)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(input))||
     Reflect.ownKeys(input).length!==needed.length||
     needed.some(k=>{
       const d=Object.getOwnPropertyDescriptor(input,k);
       return !d?.enumerable||!Object.hasOwn(d,'value');
     }))fail();
  // Avoid silently inventorying an SSH/TCP Docker daemon elsewhere.
  assertLocalDockerUnixContext(input.contextEndpoint);
  const value={
    sourceType:'operator_supplied_docker_host_inventory_unverified',
    requested:input.requested,
    host:{
      availableMemoryMiB:parseLinuxAvailableMemory(input.meminfo),
      totalCpu:input.totalCpu,
      snapshotComplete:true
    },
    existing:{
      containerNames:parseNameLines(input.containers),
      networkNames:parseNameLines(input.networks),
      volumeNames:parseNameLines(input.volumes),
      listeningPorts:parseSocketListeners(input.listeners),
      publishedPorts:parseDockerPublishedPorts(input.published)
    }
  };
  // Run the exact F147 risk review before output, even if blocked.
  const report=reviewIsolatedSeoStagingInventory(value);
  return {privateInventory:value,report};
}
