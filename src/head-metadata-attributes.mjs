/**
 * F205: lexical inspection of audited META/LINK and BASE attributes, not a DOM parser.
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
  const opening=/^<(meta|link|base)(?=[\t\n\f\r />])/i.exec(markup);
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
function* scanSeoHeadTags(head){
  for(const token of htmlRanges(head)){
    if(token.kind!=='tag')continue;
    const markup=head.slice(token.start,token.end);
    if(!markup.endsWith('>')){
      yield {tag:null,attributes:Object.create(null),entries:[],invalid:true};
      return;
    }
    if(!token.closing&&(token.name==='meta'||token.name==='link')){
      yield inspectSeoHeadTag(markup);
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

/**
 * Inspect the filtered whole document, including BODY, for a BASE that could
 * change URL resolution. This auditor does not emulate document.baseURI.
 * A valid target-only BASE is harmless to URL resolution; malformed BASE
 * attributes require review because an href may not have been parsed safely.
 * Comments/templates must already be filtered; raw text and quoted values
 * stay opaque in the shared lexer. No attribute value leaves this helper.
 */
export function hasUnsupportedDocumentBase(markup){
  for(const token of htmlRanges(markup)){
    if(token.kind!=='tag'||token.closing||token.name!=='base')continue;
    const tag=inspectSeoHeadTag(markup.slice(token.start,token.end));
    if(tag.invalid||Object.hasOwn(tag.attributes,'href'))return true;
  }
  return false;
}

const BODY_INDEXING_META=new Set(['robots','googlebot','imagine:editorial-preview']);
/**
 * F209: BODY restrictions apply to the document too, but BODY metadata must
 * never satisfy HEAD requirements. Inspect only indexing/preview META tags.
 * Call on the filtered body; raw text and quoted pseudo-markup stay opaque.
 */
export function inspectBodyRobotsMetadata(body){
  const metas=[];
  let invalidCount=0;
  for(const token of htmlRanges(body)){
    if(token.kind!=='tag'||token.closing||token.name!=='meta')continue;
    const tag=inspectSeoHeadTag(body.slice(token.start,token.end));
    const names=tag.entries.filter(entry=>entry.name==='name');
    const candidate=names.some(entry=>{
      const name=decodeCriticalValue(entry.value);
      // An unsupported name encoding cannot prove this is unrelated META.
      return name===null||BODY_INDEXING_META.has(asciiLower(name));
    });
    // A malformed tag rejected before its name was read may hide a directive.
    if(!candidate&&!(tag.invalid&&names.length===0))continue;
    if(tag.invalid){invalidCount++;continue;}
    metas.push(tag.attributes);
  }
  return {metas,invalidCount};
}

const HTML_RAW=new Set([
  'script','style','title','textarea','xmp','iframe','noembed','noframes'
]);
function tagEnd(markup,start){
  let mode='attributes',quote=null;
  for(let i=start;i<markup.length;i++){
    const c=markup[i];
    if(quote){
      if(c===quote){quote=null;mode='attributes';}
      continue;
    }
    if(c==='>')return i+1;
    if(mode==='unquoted'){
      if(SPACE.test(c))mode='attributes';
    }else if(mode==='value'){
      if(SPACE.test(c))continue;
      if(c==='"'||c==="'")quote=c;
      else mode='unquoted';
    }else if(c==='=')mode='value';
  }
  return markup.length;
}
/**
 * Quoted attributes and raw/RCDATA contents are opaque lexical ranges.
 * This does not construct a DOM or reproduce all HTML error recovery.
 */
function* htmlRanges(markup){
  const opening=/<(\/?)([a-z][a-z0-9:-]*)(?=[\t\n\f\r />])/giy;
  let cursor=0,count=0;
  while(cursor<markup.length){
    const start=markup.indexOf('<',cursor);
    if(start===-1){
      yield {kind:'text',start:cursor,end:markup.length};return;
    }
    if(start>cursor)yield {kind:'text',start:cursor,end:start};
    if(++count>50000)throw Error('audit: HTML token budget exceeded');
    if(markup.startsWith('<!--',start)){
      const body=start+4;
      let end;
      if(markup[body]==='>')end=body+1;
      else if(markup.slice(body,body+2)==='->')end=body+2;
      else{
        const close=/--!?>/g;
        close.lastIndex=body;
        const found=close.exec(markup);
        end=found?close.lastIndex:markup.length;
      }
      yield {kind:'comment',start,end};cursor=end;continue;
    }
    opening.lastIndex=start;
    const match=opening.exec(markup);
    if(!match){
      yield {kind:'text',start,end:start+1};cursor=start+1;continue;
    }
    const name=asciiLower(match[2]),closing=Boolean(match[1]);
    let end=tagEnd(markup,opening.lastIndex);
    if(!closing&&HTML_RAW.has(name)){
      const close=new RegExp('</'+name+'(?=[\\t\\n\\f\\r />])','gi');
      close.lastIndex=end;
      const found=close.exec(markup);
      end=found?tagEnd(markup,close.lastIndex):markup.length;
      yield {kind:'raw',name,start,end};cursor=end;continue;
    }
    yield {kind:'tag',name,closing,start,end};cursor=end;
  }
}
/**
 * F206: locate explicit HEAD/BODY ranges in already filtered public HTML.
 * Raw text and quoted attributes cannot open or close document sections.
 * This preserves the explicit-section contract; it does not infer omitted
 * elements or implement the browser's HTML tree-building/error recovery.
 */
export function extractDocumentSections(markup){
  const starts={head:null,body:null},sections={head:null,body:null};
  for(const token of htmlRanges(markup)){
    if(token.kind!=='tag'||!Object.hasOwn(sections,token.name))continue;
    const name=token.name;
    if(sections[name]!==null)continue;
    if(!token.closing){
      if(starts[name]===null)starts[name]=token.end;
    }else if(starts[name]!==null&&
      /^<\/(?:head|body)\s*>$/i.test(markup.slice(token.start,token.end))){
      sections[name]=markup.slice(starts[name],token.start);
    }
  }
  return {head:sections.head??'',body:sections.body??''};
}
/**
 * Remove actual comments/templates. Preserve real script/style bytes for
 * JSON-LD inspection by default, or remove them from metadata/body views.
 */
export function filterStaticHtml(markup,{removeScriptsStyles=false}={}){
  const result=[];
  let templateDepth=0;
  for(const token of htmlRanges(markup)){
    if(token.kind==='comment')continue;
    if(token.kind==='tag'&&token.name==='template'){
      if(token.closing)templateDepth=Math.max(0,templateDepth-1);
      else templateDepth++;
      continue;
    }
    if(templateDepth)continue;
    if(removeScriptsStyles&&token.kind==='raw'&&
      (token.name==='script'||token.name==='style'))continue;
    result.push(markup.slice(token.start,token.end));
  }
  return result.join('');
}
