/**
 * SEO F116: harden F112 private HTML preview output destination.
 *
 * This is a defensive local path check. It does not replace OS permissions,
 * secure workspaces or authorized deployment controls. The parent directory
 * must already exist; never create a web-public or repository-local folder.
 */
import {lstat} from 'node:fs/promises';
import {resolve,dirname,join,parse,sep} from 'node:path';

const DEPLOY_DIRECTORY_NAMES=new Set([
  'public','dist','build','out','www','wwwroot','htdocs','_site',
  '.next','.vercel','.output','_astro','uploads','static'
]);
const invalid=()=>Error('SEO F116: private nonpublished review directory required');
function validateName(input){
  return typeof input==='string' &&
    input.length>0 && input.length<=2048 &&
    !/[\u0000-\u001f\u007f]/.test(input) &&
    !/^[a-z]+:\/\//i.test(input);
}
async function safeDirectory(path){
  let stat;
  try{stat=await lstat(path);}
  catch(error){
    if(error.code==='ENOENT')throw invalid();
    throw error;
  }
  if(!stat.isDirectory()||stat.isSymbolicLink())throw invalid();
}
async function hasGitControlFile(path){
  try{
    await lstat(join(path,'.git'));
    return true;
  }catch(error){
    if(error.code==='ENOENT')return false;
    throw error;
  }
}
export async function requirePrivateEditorialPreviewDestination(input){
  if(!validateName(input))throw invalid();
  const destination=resolve(input);
  const root=parse(destination).root;
  if(destination===root||destination===resolve('.'))throw invalid();
  const relative=destination.slice(root.length);
  const segments=relative.split(sep).map(x=>x.toLowerCase());
  if(segments.some(s=>DEPLOY_DIRECTORY_NAMES.has(s)||s==='.git'))
    throw invalid();

  const parent=dirname(destination);
  // Reject symlink parents and any ancestry inside a source checkout:
  // private drafts should not become accidental tracked/untracked repo
  // artifacts, including subdirectories of a public Astro build.
  let ancestor=parent;
  for(;;){
    await safeDirectory(ancestor);
    if(await hasGitControlFile(ancestor))throw invalid();
    if(ancestor===root)break;
    const next=dirname(ancestor);
    if(next===ancestor)break;
    ancestor=next;
  }

  // Creation remains exclusive, nonrecursive, and private in F112.
  // A check-to-use race against a malicious local actor is not solved here;
  // callers must operate in a trusted private workspace.
  return destination;
}
