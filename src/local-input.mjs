/**
 * SEO-F16 — only read bounded local regular files. Never follow final-path
 * symlinks on supported platforms; validate the opened inode and read at most
 * maxBytes+1 bytes even if the file grows between checks.
 *
 * Callers must use trusted parent directories: this helper does not pin
 * every ancestor directory against concurrent rename or mount changes.
 */
import {lstat,open} from 'node:fs/promises';
import {constants} from 'node:fs';

export async function readBoundedLocalText(path,{maxBytes=10*1024*1024,withIdentity=false}={}){
  if(typeof path!=='string'||path.length===0||
    !Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>10*1024*1024)
    throw Error('SEO input: invalid local file or byte limit');
  const meta=await lstat(path);
  if(!meta.isFile()||meta.isSymbolicLink())
    throw Error('SEO input: unsafe local file');
  if(meta.size>maxBytes)
    throw Error('SEO input: size limit exceeded');
  let handle;
  try{
    handle=await open(path,constants.O_RDONLY | (constants.O_NOFOLLOW || 0));
    const actual=await handle.stat();
    if(!actual.isFile()||actual.dev!==meta.dev||actual.ino!==meta.ino)
      throw Error('SEO input: file changed or is unsafe');
    if(actual.size>maxBytes)
      throw Error('SEO input: size limit exceeded');
    const chunks=[];
    let position=0;
    for(;;){
      const buffer=Buffer.allocUnsafe(Math.min(65536,maxBytes+1-position));
      const {bytesRead}=await handle.read(buffer,0,buffer.length,position);
      if(bytesRead===0)break;
      position+=bytesRead;
      if(position>maxBytes)
        throw Error('SEO input: file exceeds size limit');
      chunks.push(buffer.subarray(0,bytesRead));
    }
    // Reject malformed UTF-8 rather than silently replacing invalid bytes.
    // Decode after joining chunks so a valid character can span read bounds.
    const bytes=Buffer.concat(chunks,position);
    try{
      const text=new TextDecoder('utf-8',{fatal:true,ignoreBOM:true}).decode(bytes);
      // F98: inode metadata comes from the SAME open descriptor as the data,
      // so two aliases cannot pretend to be independent GSC period exports.
      if(withIdentity===true)return Object.freeze({
        text,device:actual.dev,inode:actual.ino
      });
      return text;
    }catch(error){
      if(error instanceof TypeError)throw Error('SEO input: invalid UTF-8');
      throw error;
    }
  }catch(error){
    if(error.code==='ELOOP')throw Error('SEO input: symbolic link refused');
    throw error;
  }finally{
    await handle?.close();
  }
}
