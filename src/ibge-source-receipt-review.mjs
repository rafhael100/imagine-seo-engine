/**
 * SEO F117 — independently check an offline official-URL download receipt
 * against the exact normalized reference bytes. A matching digest prevents
 * undetected changes AFTER receipt creation. It is not a signed IBGE edition
 * or proof of Brazil's full current set of municipalities.
 */
import {createHash} from 'node:crypto';
import {OFFICIAL_IBGE_MUNICIPALITIES_URL} from './ibge-official-https-capture.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const UF=new Set('AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' '));
const MATCH=/^[a-f0-9]{64}$/;
function exact(x,names){
  if(x===null||typeof x!=='object'||Array.isArray(x)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(x)))return false;
  const keys=Reflect.ownKeys(x);
  return keys.length===names.length&&keys.every(k=>
    typeof k==='string'&&names.includes(k)&&
    Object.getOwnPropertyDescriptor(x,k)?.enumerable===true&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));
}
export function verifyIbgeSourceReceipt(referenceText,receipt){
  if(typeof referenceText!=='string' ||
     Buffer.byteLength(referenceText,'utf8')>2*1024*1024 ||
     !exact(receipt,[
       'contractVersion','sourceUrl','retrievedAtUtc','transport',
       'rawJsonSha256','normalizedReferenceSha256','rawBytes',
       'referenceEntries','officialHostnameAndTransportChecked',
       'rawContentSignedByIbge','territorialEditionConfirmed',
       'municipalityClassificationVerified','allMunicipalitiesCovered',
       'publicationAuthorized','indexingAuthorized','networkPerformed',
       'releaseStatus'
     ]) ||
     receipt.contractVersion!=='seo-f117-ibge-https-source-capture-v1' ||
     receipt.sourceUrl!==OFFICIAL_IBGE_MUNICIPALITIES_URL ||
     receipt.transport!=='node_https_exact_official_hostname_no_redirect' ||
     receipt.officialHostnameAndTransportChecked!==true ||
     receipt.rawContentSignedByIbge!==false ||
     receipt.territorialEditionConfirmed!==false ||
     receipt.municipalityClassificationVerified!==false ||
     receipt.allMunicipalitiesCovered!==false ||
     receipt.publicationAuthorized!==false ||
     receipt.indexingAuthorized!==false ||
     receipt.networkPerformed!==true ||
     receipt.releaseStatus!=='HOLD_SOURCE_EDITION_COVERAGE_EDITORIAL_AND_PUBLICATION_REVIEW' ||
     typeof receipt.rawJsonSha256!=='string'||
     !MATCH.test(receipt.rawJsonSha256) ||
     typeof receipt.normalizedReferenceSha256!=='string' ||
     !MATCH.test(receipt.normalizedReferenceSha256) ||
     !Number.isSafeInteger(receipt.rawBytes)||receipt.rawBytes<1||
     receipt.rawBytes>8*1024*1024||
     !Number.isInteger(receipt.referenceEntries)||
     receipt.referenceEntries<5500||receipt.referenceEntries>6000||
     typeof receipt.retrievedAtUtc!=='string'||
     !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(receipt.retrievedAtUtc) ||
     !Number.isFinite(Date.parse(receipt.retrievedAtUtc)))
    throw Error('SEO F117: captured source receipt invalid');
  if(sha(Buffer.from(referenceText,'utf8'))!==receipt.normalizedReferenceSha256)
    throw Error('SEO F117: captured reference digest mismatch');
  let parsed;
  try{parsed=JSON.parse(referenceText);}
  catch{throw Error('SEO F117: captured reference malformed');}
  if(!exact(parsed,['sourceType','entries'])||
     parsed.sourceType!=='operator_supplied_municipality_reference_unverified'||
     !Array.isArray(parsed.entries)||
     parsed.entries.length!==receipt.referenceEntries)
    throw Error('SEO F117: captured reference malformed');
  const seen=new Set();
  let previous='';
  for(const e of parsed.entries){
    if(!exact(e,['ibgeCode','state','city']) ||
      typeof e.ibgeCode!=='string'||!/^\d{7}$/.test(e.ibgeCode) ||
      !UF.has(e.state) || typeof e.city!=='string' ||
      e.city.length<2||e.city.length>120 ||
      e.ibgeCode<=previous || seen.has(e.ibgeCode))
      throw Error('SEO F117: captured reference entries invalid');
    previous=e.ibgeCode;
    seen.add(e.ibgeCode);
  }
  return {
    contractVersion:'seo-f117-ibge-source-receipt-review-v1',
    referenceEntries:parsed.entries.length,
    normalizedDigestMatches:true,
    officialHostObservedAtCapture:true,
    officialEditionSignatureVerified:false,
    municipalityClassificationVerified:false,
    releaseAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_IBGE_EDITION_AND_EDITORIAL_SIGNOFF'
  };
}
