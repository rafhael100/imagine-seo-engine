/**
 * SEO F140 — deterministic, bounded SHA-256 fingerprint of one local
 * compiled static site. Zero network. Never emits filenames or HTML content.
 * Protects the F139 lab from accidentally testing a different build.
 */
import {lstat,opendir,open} from 'node:fs/promises';
import {constants} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,join,sep} from 'node:path';

const MAX_ENTRIES=100000,MAX_DIRS=5000,MAX_FILES=20000;
const MAX_DEPTH=32,MAX_FILE=128*1024*1024,MAX_TOTAL=512*1024*1024;
function invalid(){throw Error('SEO F140: unsafe or oversized static build');}
export async function fingerprintCompiledSite(directory){
  if(typeof directory!=='string'||directory.length<1||
     directory.length>2048)invalid();
  const root=resolve(directory);
  const head=await lstat(root);
  if(!head.isDirectory()||head.isSymbolicLink())invalid();

  const stack=[{absolute:root,relative:'',depth:0}];
  const files=[];
  let dirs=0,entries=0,totalBytes=0,htmlFiles=0;
  while(stack.length){
    const next=stack.pop();
    if(++dirs>MAX_DIRS||next.depth>MAX_DEPTH)invalid();
    // A directory is traversed only if lstat confirms it is not a symlink.
    const state=await lstat(next.absolute);
    if(!state.isDirectory()||state.isSymbolicLink())invalid();
    const handle=await opendir(next.absolute);
    try{
      for await(const item of handle){
        if(++entries>MAX_ENTRIES)invalid();
        if(!item.name||item.name==='.'||item.name==='..'||
           /[\u0000-\u001f\u007f]/.test(item.name)||
           item.name==='.git')invalid();
        const relative=next.relative?
          next.relative+'/'+item.name:item.name;
        if(relative.length>1024||relative.includes('\\'))invalid();
        const absolute=join(next.absolute,item.name);
        const st=await lstat(absolute);
        if(st.isSymbolicLink())invalid();
        if(st.isDirectory()){
          stack.push({absolute,relative,depth:next.depth+1});
          continue;
        }
        if(!st.isFile()||!Number.isSafeInteger(st.size)||
           st.size<0||st.size>MAX_FILE)invalid();
        if(++entries>MAX_ENTRIES||files.length>=MAX_FILES)invalid();
        totalBytes+=st.size;
        if(totalBytes>MAX_TOTAL)invalid();
        if(relative.endsWith('.html'))htmlFiles++;
        files.push({absolute,relative,size:st.size,ino:st.ino,dev:st.dev});
      }
    }finally{await handle.close().catch(()=>{});}
  }
  if(htmlFiles===0||files.length===0)invalid();

  // Locale-independent ordering. Build hashes do not include absolute paths.
  files.sort((a,b)=>a.relative<b.relative?-1:a.relative>b.relative?1:0);
  const digest=createHash('sha256');
  digest.update('IMAGINE-SEO-F140-COMPILED-DIST-V1\n');
  const chunk=Buffer.allocUnsafe(64*1024);
  for(const file of files){
    const handle=await open(file.absolute,
      constants.O_RDONLY|constants.O_NOFOLLOW);
    try{
      const st=await handle.stat();
      if(!st.isFile()||st.size!==file.size||
         st.ino!==file.ino||st.dev!==file.dev)invalid();
      const fileHash=createHash('sha256');
      let position=0;
      while(position<file.size){
        const bytes=Math.min(chunk.length,file.size-position);
        const {bytesRead}=await handle.read(chunk,0,bytes,position);
        if(bytesRead<1)invalid();
        fileHash.update(chunk.subarray(0,bytesRead));
        position+=bytesRead;
      }
      digest.update(String(Buffer.byteLength(file.relative))+
        ':'+file.relative+':'+String(file.size)+':'+
        fileHash.digest('hex')+'\n');
    }finally{await handle.close();}
  }
  return {
    contractVersion:'seo-f140-compiled-site-digest-v1',
    sha256:digest.digest('hex'),
    filesHashed:files.length,
    htmlFilesHashed:htmlFiles,
    totalBytesHashed:totalBytes,
    networkPerformed:false
  };
}
