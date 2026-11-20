/**
 * SEO-F7 — Read-only, local contract for future Portal integration.
 * Tenant and property are operator declarations, NOT an authorization check.
 * Never returns raw search terms, CSV, property URLs, or OAuth tokens.
 */
import {createHash} from 'node:crypto';
import {importGscQueriesCsv} from './gsc-csv.mjs';
import {analyzeQueryExport} from './opportunities.mjs';
import {compareGscPeriods} from './organic-trends.mjs';

const HOST=/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const TENANT=/^[a-z0-9][a-z0-9_-]{2,63}$/i;
const digest=value=>createHash('sha256').update(value,'utf8').digest('hex');

function propertyCanonical(value){
  if(typeof value!=='string'||value.length>2048)throw Error('SEO scope: invalid property identifier');
  if(value.startsWith('sc-domain:')){
    const domain=value.slice('sc-domain:'.length).toLowerCase();
    if(!HOST.test(domain))throw Error('SEO scope: invalid domain property');
    return 'sc-domain:'+domain;
  }
  let url;
  try { url=new URL(value); } catch { throw Error('SEO scope: invalid URL property'); }
  if(url.protocol!=='https:'||!HOST.test(url.hostname)||
    url.username||url.password||url.search||url.hash)
    throw Error('SEO scope: HTTPS property without credentials, query or fragment required');
  return url.origin+url.pathname;
}

function scoped(input){
  if(!input||typeof input!=='object'||Array.isArray(input))
    throw Error('SEO scope: object required');
  const scope=input.scope;
  if(!scope||typeof scope!=='object'||Array.isArray(scope))
    throw Error('SEO scope: explicit scope required');
  if(typeof scope.tenantRef!=='string'||!TENANT.test(scope.tenantRef))
    throw Error('SEO scope: invalid tenant reference');
  if(scope.authorizationConfirmed!==true)
    throw Error('SEO scope: operator authorization declaration required');
  const canonicalProperty=propertyCanonical(scope.property);
  return {
    tenantRef:scope.tenantRef,
    propertyFingerprint:digest(canonicalProperty),
    authorization:'operator_declared_not_independently_verified'
  };
}

function data(input){
  if(typeof input.csv!=='string')throw Error('SEO scope: local CSV text required');
  return importGscQueriesCsv(input.csv,{
    startDate:input.startDate,endDate:input.endDate
  });
}

export function analyzeScopedGscCsv(input){
  const scope=scoped(input);
  const metrics=analyzeQueryExport(data(input));
  return {
    contractVersion:'seo-scoped-offline-v1',
    scope,
    sourceFingerprint:digest(input.csv),
    sourceType:'manual_csv_query_dimension_unverified',
    ...metrics,
    caveats:[
      'Tenant, property and consent are declared by the operator; this library does not authenticate users or verify property access.',
      'Import must be performed only by an authorized operator, outside CI and without storing CSV in Git.'
    ]
  };
}

export function compareScopedGscCsv(previous,current){
  const before=scoped(previous),after=scoped(current);
  if(before.tenantRef!==after.tenantRef||
    before.propertyFingerprint!==after.propertyFingerprint)
    throw Error('SEO scope: mismatched tenant or property; comparison blocked');
  const result=compareGscPeriods(data(previous),data(current));
  return {
    contractVersion:'seo-scoped-offline-v1',
    scope:before,
    sourceFingerprints:{
      previous:digest(previous.csv),
      current:digest(current.csv)
    },
    ...result,
    caveats:[
      'Scoped comparison only checks matching operator-declared identifiers.',
      'No OAuth, live property verification, database tenant isolation or consent audit is performed.'
    ]
  };
}
