/**
 * SEO F199 — consistent offline custody for private evidence, manifests,
 * host inventory and HTTP receipts. This is NOT a token vault or an OAuth
 * authorization service. File/path metadata is NEVER returned to reporters.
 */
import {lstat,realpath} from 'node:fs/promises';
import {dirname,isAbsolute,join,resolve} from 'node:path';

const MAX_PATH=2048;
function unsafe(){throw Error('SEO F199: private evidence custody failed');}
export async function reviewPrivateOperatorFilePath(path,kind,maxBytes=20*1024*1024){
 if(typeof path!=='string'||!isAbsolute(path)||path!==resolve(path)||
    path.length<2||path.length>MAX_PATH||
    /[\u0000-\u001f\u007f]/.test(path)||
    !['source','exclusive_destination'].includes(kind)||
    !Number.isSafeInteger(maxBytes)||maxBytes<2||maxBytes>20*1024*1024)
  unsafe();
 const folder=dirname(path);
 let meta,canonical;
 try{
  [meta,canonical]=await Promise.all([lstat(folder),realpath(folder)]);
 }catch{unsafe();}
 if(folder!==canonical||!meta.isDirectory()||meta.isSymbolicLink()||
    (process.platform!=='win32'&&((meta.mode&0o077)!==0||
       (typeof process.getuid==='function'&&meta.uid!==process.getuid()))))
  unsafe();
 let current=canonical;
 while(true){
  try{
   await lstat(join(current,'.git'));
   unsafe();
  }catch(e){
   if(e?.code!=='ENOENT')unsafe();
  }
  const next=dirname(current);
  if(next===current)break;
  current=next;
 }
 if(kind==='exclusive_destination')return Object.freeze({
  privateParentVerified:true,
  gitCheckoutExcluded:true,
  outputMustBeCreatedExclusive:true
 });
 let f;
 try{f=await lstat(path);}catch{unsafe();}
 if(!f.isFile()||f.isSymbolicLink()||f.size<2||f.size>maxBytes||
    (process.platform!=='win32'&&((f.mode&0o077)!==0||
       (typeof process.getuid==='function'&&f.uid!==process.getuid()))))
  unsafe();
 // These fields remain in the caller process only for an exact O_NOFOLLOW
 // descriptor identity check. Never serialize source paths/inodes.
 return Object.freeze({
  size:f.size,ino:f.ino,dev:f.dev,privateParentVerified:true,
  privateSourceVerified:true,gitCheckoutExcluded:true
 });
}
