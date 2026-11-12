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
  // F96: manifest references must be basenames alongside the manifest.
  // Reject absolute, nested and parent-relative paths before touching files.
  // This prevents an imported manifest from selecting unrelated local files.
  const localName=(name,extension)=>{
    const badSeparator=typeof name==='string'&&
      (name.includes('/')||name.includes(String.fromCharCode(92))||
       name.includes(':'));
    const badControl=typeof name==='string'&&[...name].some(char=>{
      const code=char.charCodeAt(0);
      return code<32||code===127;
    });
    if(typeof name!=='string'||name.length>128||name.length<=extension.length||
      name[0]==='.'||name.trim()!==name||badSeparator||badControl||
      !name.toLowerCase().endsWith(extension))
      throw Error('SEO input: invalid CSV handoff file');
    return name;
  };
  // F97: validate EVERY manifest file reference before reading any private
  // evidence. Keep the previous/current source files distinct even on
  // case-insensitive filesystems, avoiding a silently self-compared export.
  const auditName=localName(manifest.auditFile,'.json');
  const previousName=localName(manifest.previous.file,'.csv');
  const currentName=localName(manifest.current.file,'.csv');
  if(previousName.toLocaleLowerCase('pt-BR')===
     currentName.toLocaleLowerCase('pt-BR'))
    throw Error('SEO input: distinct CSV handoff files required');
  const load=(name,limit)=>readBoundedLocalText(
    resolve(root,name),{maxBytes:limit}
  );
  // Never parse CSV columns as precomputed organic summaries.
  const audit=parseSafeJson(await load(auditName,2*1024*1024));
  const previous=importGscQueriesCsv(
    await load(previousName,10*1024*1024),{
      startDate:manifest.previous.startDate,
      endDate:manifest.previous.endDate
    });
  const current=importGscQueriesCsv(
    await load(currentName,10*1024*1024),{
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
