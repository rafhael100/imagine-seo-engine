/**
 * SEO F152 — deliberately wrong resource limit for a disposable CI-only
 * negative test. This must NEVER be interpreted as approved staging Compose.
 * Does not execute Docker or return any authority to deploy.
 */
export function makeCiOnlyMemoryDriftFixture(compose){
 if(typeof compose!=='string'||compose.length>256*1024||
    !compose.startsWith('# SEO F149 — PRIVATE STAGING ONLY.')||
    !compose.includes('read_only: true')||
    !compose.includes('cap_drop: ["ALL"]')||
    !compose.includes('no-new-privileges:true')||
    !compose.includes('ports: ["127.0.0.1:')||
    !compose.includes('restart: "no"'))
   throw Error('SEO F152: untrusted or unsupported Compose baseline');
 const needle='    mem_limit: "512m"';
 const instances=compose.split(needle).length-1;
 if(instances!==1)
   throw Error('SEO F152: expected exactly one baseline memory limit');
 return compose.replace(needle,'    mem_limit: "768m"');
}
