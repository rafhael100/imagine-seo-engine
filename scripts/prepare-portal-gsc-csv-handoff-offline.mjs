/**
 * F95 — one manifest to join a static audit with two manually supplied
 * Search Console query CSV exports. No Google API, OAuth, network or writes.
 * Path resolution uses the manifest directory, which MUST be trusted.
 */
import {dirname,resolve} from 'node:path';
import {readBoundedLocalText} from '../src/local-input.mjs';
import {parseSafeJson,safeCliDiagnostic} from '../src/cli-diagnostics.mjs';
import {importGscQueriesCsv} from '../src/gsc-csv.mjs';
import {prepareOfflinePortalSeoFromOriginalGsc}
  from '../src/portal-original-gsc-handoff.mjs';

const isFields=(value,fields)=>
  value!==null&&typeof value==='object'&&!Array.isArray(value)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(value))&&
  Reflect.ownKeys(value).length===fields.length&&
  fields.every(name=>Object.hasOwn(value,name)&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(value,name),'value'));

const [file,...extra]=process.argv.slice(2);
if(!file||extra.length){
  console.error('Usage: node scripts/prepare-portal-gsc-csv-handoff-offline.mjs <private-manifest.json>');
  process.exitCode=2;
}else try{
  const manifest=parseSafeJson(await readBoundedLocalText(file,{
    maxBytes:32*1024
  }));
  if(!isFields(manifest,['auditFile','previous','current','scope'])||
    typeof manifest.auditFile!=='string'||!manifest.auditFile||
    !isFields(manifest.previous,['file','startDate','endDate'])||
    !isFields(manifest.current,['file','startDate','endDate'])||
    !isFields(manifest.scope,['tenantRef','propertyFingerprint','sourceRevision']))
    throw Error('SEO input: invalid CSV handoff manifest');
  const root=dirname(resolve(file));
  const load=(name,limit)=>{
    if(typeof name!=='string'||!name||name.length>2048)
      throw Error('SEO input: invalid CSV handoff file');
    return readBoundedLocalText(resolve(root,name),{maxBytes:limit});
  };
  // Never parse CSV columns as precomputed organic summaries.
  const audit=parseSafeJson(await load(manifest.auditFile,2*1024*1024));
  const previous=importGscQueriesCsv(
    await load(manifest.previous.file,10*1024*1024),{
      startDate:manifest.previous.startDate,
      endDate:manifest.previous.endDate
    });
  const current=importGscQueriesCsv(
    await load(manifest.current.file,10*1024*1024),{
      startDate:manifest.current.startDate,
      endDate:manifest.current.endDate
    });
  const result=prepareOfflinePortalSeoFromOriginalGsc({
    audit,previous,current,scope:manifest.scope
  });
  console.log(JSON.stringify(result,null,2));
}catch(error){
  console.error('SEO CSV Portal handoff refused:',safeCliDiagnostic(error));
  process.exitCode=2;
}
