/**
 * SEO F117 — bounded, exact-origin HTTPS transport for the public IBGE
 * Localidades v1 municipality directory. This deliberately verifies
 * transport/source URL and records a digest, NOT a data signature,
 * territorial edition, municipal-service coverage or SEO approval.
 *
 * Never supply any dynamic URL, bearer token, cookie, API key or query.
 */
import {createHash} from 'node:crypto';
import {parseSafeJson} from './cli-diagnostics.mjs';
import {normalizeLocallySuppliedIbgeMunicipalities}
  from './ibge-localities-offline-import.mjs';

export const OFFICIAL_IBGE_MUNICIPALITIES_URL=
  'https://servicodados.ibge.gov.br/api/v1/localidades/municipios';
const MAX_BODY_BYTES=8*1024*1024;
const MAX_REFERENCE_BYTES=2*1024*1024;
const MAX_TIME_MS=25000;
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function captureOfficialIbgeReference({
  fetchImpl=globalThis.fetch,
  now=new Date()
}={}){
  if(typeof fetchImpl!=='function' ||
     !(now instanceof Date) ||
     !Number.isFinite(now.getTime()))
    throw Error('SEO F117: invalid capture environment');

  const response=await fetchImpl(OFFICIAL_IBGE_MUNICIPALITIES_URL,{
    method:'GET',
    redirect:'error',
    signal:AbortSignal.timeout(MAX_TIME_MS),
    cache:'no-store',
    headers:{Accept:'application/json'},
    credentials:'omit'
  });
  if(!response || response.url!==OFFICIAL_IBGE_MUNICIPALITIES_URL ||
     response.status!==200 || !response.ok ||
     !/^application\/json(?:\s*;|$)/i.test(
       response.headers?.get('content-type')??'') ||
     !response.body)
    throw Error('SEO F117: official HTTPS source response rejected');

  const announced=response.headers.get('content-length');
  if(announced!==null){
    const count=Number(announced);
    if(!Number.isSafeInteger(count)||count<1||count>MAX_BODY_BYTES)
      throw Error('SEO F117: source response size rejected');
  }
  const chunks=[];
  let bytesRead=0;
  try{
    for await (const chunk of response.body){
      if(!(chunk instanceof Uint8Array))
        throw Error('SEO F117: invalid body chunk');
      bytesRead+=chunk.byteLength;
      if(bytesRead>MAX_BODY_BYTES)
        throw Error('SEO F117: source response size rejected');
      chunks.push(Buffer.from(chunk));
    }
  }catch(error){
    await response.body.cancel?.().catch(()=>{});
    throw error;
  }
  if(bytesRead===0)throw Error('SEO F117: empty source');
  const bytes=Buffer.concat(chunks,bytesRead);
  const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  const entries=parseSafeJson(text);
  const reference=normalizeLocallySuppliedIbgeMunicipalities(entries);
  // Broad sanity bound, NOT a claim that a list of this length is a full
  // Brazilian municipality inventory. DF and other territorial units differ.
  if(reference.entries.length<5500 || reference.entries.length>6000)
    throw Error('SEO F117: unexpected municipality-reference size');
  const normalizedText=JSON.stringify(reference,null,2)+'\n';
  if(Buffer.byteLength(normalizedText,'utf8')>MAX_REFERENCE_BYTES)
    throw Error('SEO F117: normalized reference exceeds limit');

  const provenance={
    contractVersion:'seo-f117-ibge-https-source-capture-v1',
    sourceUrl:OFFICIAL_IBGE_MUNICIPALITIES_URL,
    retrievedAtUtc:now.toISOString(),
    transport:'node_https_exact_official_hostname_no_redirect',
    rawJsonSha256:digest(bytes),
    normalizedReferenceSha256:digest(Buffer.from(normalizedText,'utf8')),
    rawBytes:bytesRead,
    referenceEntries:reference.entries.length,
    officialHostnameAndTransportChecked:true,
    rawContentSignedByIbge:false,
    territorialEditionConfirmed:false,
    municipalityClassificationVerified:false,
    allMunicipalitiesCovered:false,
    publicationAuthorized:false,
    indexingAuthorized:false,
    networkPerformed:true,
    releaseStatus:'HOLD_SOURCE_EDITION_COVERAGE_EDITORIAL_AND_PUBLICATION_REVIEW'
  };
  return {reference,normalizedText,provenance};
}
