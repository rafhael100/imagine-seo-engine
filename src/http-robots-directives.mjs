/**
 * F207: bounded inspection of distinct X-Robots-Tag fields for Googlebot's
 * general search crawler. This is not a complete HTTP/robots parser and does
 * not establish actual indexing, crawler access, or publication authority.
 * Never return response values, agent names, URLs, dates, or raw directives.
 */
const SIMPLE=new Set([
  'all','index','follow','noindex','nofollow','none','nosnippet',
  'noimageindex','noarchive','nocache','notranslate','nositelinkssearchbox',
  'indexifembedded'
]);
const PARAMETERS=new Set([
  'max-snippet','max-image-preview','max-video-preview','unavailable_after'
]);
const SCOPE=/^[a-z][a-z0-9_-]{0,63}$/;
const MAX_FIELDS=32,MAX_CHARACTERS=8192,MAX_PARTS=256;

export function inspectHttpRobotsDirectives(fields){
  const result={noindex:false,nofollow:false,scheduled:false,ambiguous:false};
  const uncertain=()=>{result.ambiguous=true;};
  if(!Array.isArray(fields)||fields.length>MAX_FIELDS){
    uncertain();return Object.freeze(result);
  }
  let length=0,parts=0;
  for(const field of fields){
    if(typeof field!=='string'||
       (length+=field.length)>MAX_CHARACTERS||
       /[^\x09\x20-\x7e]/.test(field)){
      uncertain();return Object.freeze(result);
    }
    // Scope begins anew for EACH wire field. Repeated fields are legitimate;
    // a permissive field cannot cancel a restriction in another field.
    let applies=true;
    for(let part of field.split(',')){
      if(++parts>MAX_PARTS){uncertain();return Object.freeze(result);}
      part=part.trim().toLowerCase();
      let colon=part.indexOf(':');
      if(colon>=0){
        const prefix=part.slice(0,colon).trim();
        if(!PARAMETERS.has(prefix)){
          if(!SCOPE.test(prefix)||SIMPLE.has(prefix)){
            if(applies)uncertain();
            continue;
          }
          applies=prefix==='googlebot';
          part=part.slice(colon+1).trim();
          colon=part.indexOf(':');
        }
      }
      if(!applies)continue;
      if(colon>=0){
        const rule=part.slice(0,colon).trim();
        const value=part.slice(colon+1).trim();
        if(rule==='unavailable_after'){
          // A schedule needs an explicit policy review. No wall-clock/date
          // guess may silently turn a timed restriction into an approval.
          result.scheduled=true;
          if(value.length===0)uncertain();
        }else if(rule==='max-image-preview'){
          if(!['none','standard','large'].includes(value))uncertain();
        }else if(rule==='max-snippet'||rule==='max-video-preview'){
          if(!/^(?:-1|\d{1,10})$/.test(value))uncertain();
        }else uncertain();
        continue;
      }
      // Accept simple rules separated by ASCII spaces as well as commas;
      // punctuation, unknown rules, and nested scopes require human review.
      const rules=part.split(/[\t ]+/);
      if(rules.some(rule=>!SIMPLE.has(rule))){uncertain();continue;}
      for(const rule of rules){
        if(rule==='noindex'||rule==='none')result.noindex=true;
        if(rule==='nofollow'||rule==='none')result.nofollow=true;
      }
    }
  }
  return Object.freeze(result);
}
