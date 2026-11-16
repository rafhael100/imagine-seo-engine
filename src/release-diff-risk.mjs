/** F160: deterministic read-only categorization of a cumulative Git diff. */
const groups=Object.freeze([
 ['ci_supply_chain',/^(?:\.github\/|(?:package-lock|pnpm-lock|yarn\.lock)|package\.json)/i],
 ['security_identity',/(?:auth|rbac|tenant|consent|privacy|lgpd|secret|token|signature|ed25519|credential|revoke|audit-log)/i],
 ['infrastructure',/(?:docker|compose|nginx|staging|deploy|rollback|firewall|backup|restore|runtime|\.tf$)/i],
 ['territorial_editorial',/(?:ibge|municip|territor|localit|dtb|editorial|doorway|hreflang|sitemap|canonical)/i],
 ['integration',/(?:gsc|search-console|ga4|portal|comercial|crm|handoff|gateway|receiver|webhook)/i],
 ['tests',/^(?:tests\/|fixtures\/|labs\/)/i],
 ['documentation',/^(?:docs\/|reports\/)|(?:README|\.md$)/i]
]);
export function categorizeReleaseDiff(paths){
 if(!Array.isArray(paths)||!paths.length)throw Error('F160: nonempty changed paths required');
 const seen=new Set();
 const categories=Object.fromEntries(groups.map(([name])=>[name,[]]));
 categories.other=[];
 for(const path of paths){
  if(typeof path!=='string'||path.length>400||!path||
    path.startsWith('/')||path.includes('\\')||
    path.split('/').some(s=>!s||s==='.'||s==='..')||
    /[\u0000-\u001f\u007f]/.test(path)||seen.has(path))
   throw Error('F160: invalid or repeated relative path');
  seen.add(path);
  const group=groups.find(([,regex])=>regex.test(path))?.[0]??'other';
  categories[group].push(path);
 }
 const totals=Object.fromEntries(Object.entries(categories).map(([k,v])=>[k,v.length]));
 const highRisk=totals.ci_supply_chain+totals.security_identity+totals.infrastructure;
 return Object.freeze({
  contractVersion:'seo-f160-cumulative-diff-review-v1',
  changedPaths:paths.length,
  categories:Object.freeze(totals),
  criticalReviewPaths:highRisk,
  independentReviewRequired:true,
  releaseStatus:'HOLD_INDEPENDENT_DIFF_SOURCE_AND_OPERATIONAL_GATES',
  networkPerformed:false,
  publicationAuthorized:false,
  mergeAuthorized:false,
  deployAuthorized:false
 });
}
