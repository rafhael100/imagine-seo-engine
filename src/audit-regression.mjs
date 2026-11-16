/**
 * SEO-F9 — Compare two prior locally produced static-site audit JSON reports.
 * No HTTP requests, ranking claims, automatic deployment, or data collection.
 * Deliberately discards untrusted issue messages from output.
 */
const LIMITS=Object.freeze({
  maxErrors:0,maxWarnings:0,maxNewErrors:0,maxNewWarnings:0,blockPageLoss:true,blockRouteLoss:true
});
const integer=(value,max=200000)=>Number.isSafeInteger(value)&&value>=0&&value<=max;
const POLICY_FIELDS=new Set(Object.keys(LIMITS));

function validateReport(report){
  if(!report||typeof report!=='object'||Array.isArray(report)||
    !report.summary||!Array.isArray(report.errors)||!Array.isArray(report.warnings))
    throw Error('SEO audit gate: structured audit report required');
  const {pages,errors,warnings}=report.summary;
  if(!integer(pages,20000)||!integer(errors)||!integer(warnings)||
    report.errors.length!==errors||report.warnings.length!==warnings)
    throw Error('SEO audit gate: inconsistent summary counters');
  const check=(items,severity)=>items.map(issue=>{
    if(!issue||typeof issue!=='object'||Array.isArray(issue)||
      typeof issue.type!=='string'||!/^[a-z][a-z0-9_]{0,63}$/.test(issue.type)||
      typeof issue.file!=='string'||issue.file.length<1||issue.file.length>256||
      issue.file.startsWith('/')||issue.file.includes('\\')||
      issue.file.split('/').some(x=>x==='..'||x===''||x==='.')||
      /[\u0000-\u001f\u007f]/.test(issue.file))
      throw Error('SEO audit gate: invalid issue identifier');
    return {severity,type:issue.type,file:issue.file};
  });
  let routes=null;
  if(Object.hasOwn(report,'routes')){
    if(!Array.isArray(report.routes)||report.routes.length!==pages)
      throw Error('SEO audit gate: invalid route inventory');
    routes=report.routes.map(route=>{
      if(typeof route!=='string'||route.length>512||
        !route.startsWith('/')||route.includes('\\')||
        /[?#\u0000-\u001f\u007f]/.test(route)||
        route.split('/').some(part=>part==='.'||part==='..'))
        throw Error('SEO audit gate: invalid route inventory');
      return route;
    });
    if(new Set(routes).size!==routes.length)
      throw Error('SEO audit gate: duplicate routes in inventory');
    routes.sort();
  }
  return {
    summary:{pages,errors,warnings},routes,
    issues:[...check(report.errors,'error'),...check(report.warnings,'warning')]
  };
}
const key=issue=>issue.severity+':'+issue.type+':'+issue.file;
const compareKey=(a,b)=>key(a).localeCompare(key(b));
// A single page may have multiple broken links or duplicate findings with
// identical severity, type and file. Counting only unique keys would conceal
// an increasing number of errors within that same page.
function countOccurrences(issues){
  const counts=new Map();
  for(const item of issues){
    const id=key(item);
    const current=counts.get(id);
    if(current)current.count++;
    else counts.set(id,{item,count:1});
  }
  return counts;
}
function changedOccurrences(candidate,baseline){
  const out=[];
  for(const [id,entry] of candidate){
    const delta=entry.count-(baseline.get(id)?.count??0);
    for(let n=0;n<delta;n++)out.push(entry.item);
  }
  return out.sort(compareKey);
}

export function compareStaticAuditReports(previousRaw,currentRaw,options={}){
  if(!options||typeof options!=='object'||Array.isArray(options)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(options))||
    Reflect.ownKeys(options).some(k=>typeof k!=='string'||
      !POLICY_FIELDS.has(k)||
      !Object.hasOwn(Object.getOwnPropertyDescriptor(options,k),'value')))
    throw Error('SEO audit gate: invalid policy');
  const policy={...LIMITS,...options};
  if(!['maxErrors','maxWarnings','maxNewErrors','maxNewWarnings','blockPageLoss','blockRouteLoss'].every(k=>Object.hasOwn(policy,k)) ||
    ['maxErrors','maxWarnings','maxNewErrors','maxNewWarnings'].some(k=>!integer(policy[k]))||
    (typeof policy.blockPageLoss!=='boolean'||typeof policy.blockRouteLoss!=='boolean'))
    throw Error('SEO audit gate: invalid policy');
  const previous=validateReport(previousRaw),current=validateReport(currentRaw);
  const prev=countOccurrences(previous.issues),now=countOccurrences(current.issues);
  const introduced=changedOccurrences(now,prev);
  const resolved=changedOccurrences(prev,now);
  const newErrors=introduced.filter(x=>x.severity==='error').length;
  const newWarnings=introduced.filter(x=>x.severity==='warning').length;
  const removedPageCount=Math.max(0,previous.summary.pages-current.summary.pages);
  const routeInventoryCompared=previous.routes!==null&&current.routes!==null;
  const routeInventoryRegressed=previous.routes!==null&&current.routes===null;
  const oldRoutes=new Set(previous.routes??[]),newRoutes=new Set(current.routes??[]);
  const removedRoutes=routeInventoryCompared?previous.routes.filter(route=>!newRoutes.has(route)):[];
  const addedRoutes=routeInventoryCompared?current.routes.filter(route=>!oldRoutes.has(route)):[];
  const passed=current.summary.errors<=policy.maxErrors &&
    current.summary.warnings<=policy.maxWarnings &&
    newErrors<=policy.maxNewErrors &&
    newWarnings<=policy.maxNewWarnings &&
    (!policy.blockPageLoss || removedPageCount===0) &&
    (!policy.blockRouteLoss || (!routeInventoryRegressed&&removedRoutes.length===0));
  return {
    contractVersion:'seo-audit-regression-v1',
    sourceType:'operator_supplied_static_audit_json_unverified',
    passed,
    policy,
    previous:previous.summary,
    current:current.summary,
    changes:{newErrors,newWarnings,resolvedIssues:resolved.length,removedPageCount,
      removedRouteCount:removedRoutes.length,addedRouteCount:addedRoutes.length,
      routeInventoryCompared,routeInventoryRegressed},
    removedRoutes,addedRoutes,introduced,resolved,
    limitations:[
      'The offline comparison only checks submitted local build reports.',
      'Repeated issues of the same type and file are counted as occurrences; free-text messages are ignored.',
      'Route loss can only be compared when both reports contain a valid route inventory.',
      'No live crawl, ranking measurement, publication, or production confirmation is performed.'
    ]
  };
}
