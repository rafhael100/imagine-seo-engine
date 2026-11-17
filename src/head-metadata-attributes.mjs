/**
 * F205: lexical inspection of audited META/LINK attributes, not a DOM parser.
 * First values are retained; ambiguous critical attributes fail closed.
 */
const SPACE=/[\t\n\f\r ]/;
const CRITICAL=new Set(['name','property','content','rel','href','hreflang']);
const NAMED=Object.freeze({
  amp:'&',AMP:'&',lt:'<',LT:'<',gt:'>',GT:'>',
  quot:'"',QUOT:'"',apos:"'",Tab:'\t',NewLine:'\n'
});
const asciiLower=value=>value.replace(/[A-Z]/g,c=>c.toLowerCase());
function decodeCriticalValue(value){
  let result='',cursor=0;
  for(let amp=value.indexOf('&');amp!==-1;amp=value.indexOf('&',cursor)){
    result+=value.slice(cursor,amp);
    const end=value.indexOf(';',amp+1);
    if(end===-1||end-amp>32)return null;
    const token=value.slice(amp+1,end);
    let decoded;
    if(Object.hasOwn(NAMED,token))decoded=NAMED[token];
    else{
      const number=/^#(?:x([0-9a-f]{1,6})|([0-9]{1,7}))$/i.exec(token);
      if(!number)return null;
      const cp=parseInt(number[1]??number[2],number[1]===undefined?10:16);
      // Decode the ASCII SEO vocabulary only. Unsupported references require
      // explicit review, avoiding partial legacy/replacement-codepoint rules.
      if(![9,10,12,13].includes(cp)&&(cp<32||cp>126))return null;
      decoded=String.fromCharCode(cp);
    }
    result+=decoded;
    cursor=end+1;
  }
  return result+value.slice(cursor);
}
function inspectSeoHeadTag(markup){
  const result={
    tag:null,attributes:Object.create(null),entries:[],
    invalid:false,markup
  };
  const fail=()=>{result.invalid=true;return result;};
  const opening=/^<(meta|link)(?=[\t\n\f\r />])/i.exec(markup);
  if(!opening)return fail();
  result.tag=asciiLower(opening[1]);
  let i=opening[0].length,needsSpace=false,closed=false;
  while(i<markup.length){
    const before=i;
    while(SPACE.test(markup[i]??''))i++;
    if(markup[i]==='>'||markup.slice(i,i+2)==='/>'){
      i+=markup[i]==='>'?1:2;closed=true;break;
    }
    if(needsSpace&&i===before)return fail();
    const nameStart=i;
    while(i<markup.length&&
      !/[\t\n\f\r /=>"'\u0060<\u0000-\u001f\u007f]/.test(markup[i]))i++;
    if(i===nameStart)return fail();
    const name=asciiLower(markup.slice(nameStart,i)),nameEnd=i;
    while(SPACE.test(markup[i]??''))i++;
    let value='',quoted=false;
    if(markup[i]==='='){
      i++;
      while(SPACE.test(markup[i]??''))i++;
      if(markup[i]==='"'||markup[i]==="'"){
        const quote=markup[i++],end=markup.indexOf(quote,i);
        if(end===-1)return fail();
        value=markup.slice(i,end);i=end+1;quoted=true;
      }else{
        const start=i;
        while(i<markup.length&&!SPACE.test(markup[i])&&markup[i]!=='>')i++;
        value=markup.slice(start,i);
        if(!value||/["'=<>\u0060\u0000]/.test(value))return fail();
      }
    }else i=nameEnd;
    if(value.includes('\u0000')||result.entries.length>=128)return fail();
    result.entries.push({name,value,quoted});
    if(Object.hasOwn(result.attributes,name)){
      if(CRITICAL.has(name))result.invalid=true;
    }else result.attributes[name]=value;
    needsSpace=true;
  }
  if(!closed||i!==markup.length)return fail();
  const attrs=result.attributes;
  const decode=name=>{
    if(!Object.hasOwn(attrs,name))return;
    const value=decodeCriticalValue(attrs[name]);
    if(value===null)result.invalid=true;else attrs[name]=value;
  };
  for(const name of ['name','property','rel','hreflang'])decode(name);
  const name=asciiLower(attrs.name??''),property=asciiLower(attrs.property??'');
  const rel=asciiLower(attrs.rel??'').split(/[\t\n\f\r ]+/);
  if(result.tag==='link'&&
    (rel.includes('canonical')||Object.hasOwn(attrs,'hreflang')))decode('href');
  if(result.tag==='meta'&&
    (['robots','googlebot','imagine:editorial-preview'].includes(name)||
      property==='og:url'))decode('content');
  return result;
}
/**
 * Walk the already filtered head, respecting quoted tag boundaries and title
 * RCDATA. Other existing HTML heuristics remain the caller's responsibility.
 */
function* scanSeoHeadTags(head){
  const tags=/<(\/?)([a-z][a-z0-9:-]*)(?=[\t\n\f\r />])/gi;
  let match,count=0;
  while((match=tags.exec(head))){
    if(++count>50000)throw Error('audit: head tag budget exceeded');
    let end=tags.lastIndex,quote=null;
    for(;end<head.length;end++){
      const c=head[end];
      if(quote){if(c===quote)quote=null;}
      else if(c==='"'||c==="'")quote=c;
      else if(c==='>')break;
    }
    if(end===head.length){
      yield {tag:null,attributes:Object.create(null),entries:[],invalid:true};
      return;
    }
    tags.lastIndex=end+1;
    const tag=asciiLower(match[2]);
    if(match[1])continue;
    if(tag==='title'){
      const close=/<\/title[\t\n\f\r ]*>/gi;
      close.lastIndex=tags.lastIndex;
      if(!close.exec(head))return;
      tags.lastIndex=close.lastIndex;
    }else if(tag==='meta'||tag==='link'){
      yield inspectSeoHeadTag(head.slice(match.index,end+1));
    }
  }
}
export function inspectHeadMetadata(head){
  const metas=[],links=[],linkMarkup=[];
  let invalidCount=0;
  for(const tag of scanSeoHeadTags(head)){
    // Preserve invalid LINK markup too: the existing stricter hreflang
    // checker must still emit its established diagnostic for duplicates.
    if(tag.tag==='link')linkMarkup.push(tag.markup);
    if(tag.invalid){invalidCount++;continue;}
    if(tag.tag==='meta')metas.push(tag.attributes);
    else if(tag.tag==='link')links.push(tag.attributes);
  }
  return {metas,links,linkMarkup,invalidCount};
}
