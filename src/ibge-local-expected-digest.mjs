/**
 * SEO F119 — outage-safe, operator-supplied IBGE-format JSON import.
 * Requires an expected SHA-256 obtained independently by an operator.
 * Matching hashes prove file identity relative to that expected hash,
 * NOT that the original was actually issued by the official IBGE API.
 */
import {createHash} from 'node:crypto';
import {parseSafeJson} from './cli-diagnostics.mjs';
import {normalizeLocallySuppliedIbgeMunicipalities}
  from './ibge-localities-offline-import.mjs';

const SHA=/^[a-f0-9]{64}$/;
const HASH=text=>createHash('sha256').update(Buffer.from(text,'utf8')).digest('hex');
const EXPECTED_FIELDS=[
  'contractVersion','expectedRawSha256','observedRawSha256',
  'normalizedReferenceSha256','referenceEntries','capturedAtUtc',
  'sourceType','operatorProvidedDigestMatched','ibgeHttpsObserved',
  'officialOriginAuthenticated','territorialEditionConfirmed',
  'municipalityTypesVerified','completeMunicipalRegistryVerified',
  'publicationAuthorized','networkPerformed','releaseStatus'
];
function exact(x,names){
  if(x===null||typeof x!=='object'||Array.isArray(x)||
     ![Object.prototype,null].includes(Object.getPrototypeOf(x)))return false;
  const keys=Reflect.ownKeys(x);
  return keys.length===names.length&&keys.every(k=>
    typeof k==='string'&&names.includes(k)&&
    Object.getOwnPropertyDescriptor(x,k)?.enumerable===true&&
    Object.hasOwn(Object.getOwnPropertyDescriptor(x,k),'value'));
}
function buildReference(rawText,expectedSha256){
  if(typeof rawText!=='string'||Buffer.byteLength(rawText,'utf8')>8*1024*1024||
     typeof expectedSha256!=='string'||!SHA.test(expectedSha256))
    throw Error('SEO F119: invalid bounded offline source');
  const observed=HASH(rawText);
  if(observed!==expectedSha256)
    throw Error('SEO F119: independent expected digest mismatch');
  const reference=normalizeLocallySuppliedIbgeMunicipalities(
    parseSafeJson(rawText));
  if(reference.entries.length<5500||reference.entries.length>6000)
    throw Error('SEO F119: incomplete or unbounded municipality reference');
  const normalizedText=JSON.stringify(reference,null,2)+'\n';
  if(Buffer.byteLength(normalizedText,'utf8')>2*1024*1024)
    throw Error('SEO F119: normalized reference too large');
  return {reference,normalizedText};
}
export function importIbgeFileWithIndependentExpectedSha({
  rawText,expectedSha256,now=new Date()
}={}){
  if(!(now instanceof Date)||!Number.isFinite(now.getTime()))
    throw Error('SEO F119: invalid clock');
  const normalized=buildReference(rawText,expectedSha256);
  const receipt={
    contractVersion:'seo-f119-local-ibge-expected-sha256-v1',
    expectedRawSha256:expectedSha256,
    observedRawSha256:expectedSha256,
    normalizedReferenceSha256:HASH(normalized.normalizedText),
    referenceEntries:normalized.reference.entries.length,
    capturedAtUtc:now.toISOString(),
    sourceType:'operator_supplied_file_with_external_expected_digest',
    operatorProvidedDigestMatched:true,
    ibgeHttpsObserved:false,
    officialOriginAuthenticated:false,
    territorialEditionConfirmed:false,
    municipalityTypesVerified:false,
    completeMunicipalRegistryVerified:false,
    publicationAuthorized:false,
    networkPerformed:false,
    releaseStatus:'HOLD_OPERATOR_SOURCE_PROVENANCE_AND_TERRITORIAL_EDITORIAL_REVIEW'
  };
  return {...normalized,receipt};
}
export function verifyOfflineIbgeFileReceipt({
  rawText,referenceText,receipt
}={}){
  if(!exact(receipt,EXPECTED_FIELDS)||
     typeof receipt.expectedRawSha256!=='string'||
     !SHA.test(receipt.expectedRawSha256)||
     receipt.expectedRawSha256!==receipt.observedRawSha256||
     typeof receipt.normalizedReferenceSha256!=='string'||
     !SHA.test(receipt.normalizedReferenceSha256)||
     !Number.isSafeInteger(receipt.referenceEntries)||
     receipt.referenceEntries<5500||receipt.referenceEntries>6000||
     receipt.contractVersion!=='seo-f119-local-ibge-expected-sha256-v1'||
     receipt.sourceType!=='operator_supplied_file_with_external_expected_digest'||
     receipt.operatorProvidedDigestMatched!==true||
     receipt.ibgeHttpsObserved!==false||
     receipt.officialOriginAuthenticated!==false||
     receipt.territorialEditionConfirmed!==false||
     receipt.municipalityTypesVerified!==false||
     receipt.completeMunicipalRegistryVerified!==false||
     receipt.publicationAuthorized!==false||
     receipt.networkPerformed!==false||
     receipt.releaseStatus!=='HOLD_OPERATOR_SOURCE_PROVENANCE_AND_TERRITORIAL_EDITORIAL_REVIEW'||
     typeof receipt.capturedAtUtc!=='string'||
     !Number.isFinite(Date.parse(receipt.capturedAtUtc)))
    throw Error('SEO F119: invalid offline provenance receipt');
  const rebuilt=buildReference(rawText,receipt.expectedRawSha256);
  if(typeof referenceText!=='string'||
     referenceText!==rebuilt.normalizedText||
     HASH(referenceText)!==receipt.normalizedReferenceSha256||
     rebuilt.reference.entries.length!==receipt.referenceEntries)
    throw Error('SEO F119: normalized reference or receipt mismatch');
  return {
    contractVersion:'seo-f119-offline-source-recheck-v1',
    referenceEntries:rebuilt.reference.entries.length,
    expectedOperatorDigestMatched:true,
    normalizedReferenceMatched:true,
    ibgeOfficialOriginIndependentlyVerified:false,
    allMunicipalitiesVerified:false,
    publishAllowed:false,
    networkPerformed:false,
    releaseStatus:'HOLD_OFFICIAL_SOURCE_CONFIRMATION_AND_EDITORIAL_SIGNOFF'
  };
}
