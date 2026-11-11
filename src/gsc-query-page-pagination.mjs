/**
 * SEO-F59 — assemble at most 4 operator-provided GSC query/page pages,
 * then reuse F57 to validate all rows globally (including cross-page
 * click ordering and duplicate query/page keys).
 * No network, OAuth, tokens, persistence or customer-facing identities.
 */
import {reviewOfflineGscQueryPageOverlap} from './gsc-query-page-overlap.mjs';
import {isStrictDataArray} from './gsc-strict-arrays.mjs';

const PAGE_FIELDS=new Set(['startRow','rows','responseAggregationType','metadata']);
const SCOPE_FIELDS=new Set(['tenantRef','siteUrl','propertyFingerprint',
  'startDate','endDate','rowLimit']);
const plain=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(value));
const dataOnly=(obj,allowed)=>plain(obj)&&Reflect.ownKeys(obj).every(key=>
  typeof key==='string'&&allowed.has(key)&&
  Object.hasOwn(Object.getOwnPropertyDescriptor(obj,key),'value'));

export function reviewOfflineGscQueryPagePagination(pages,scope){
  if(!isStrictDataArray(pages,4)||pages.length===0||
    !dataOnly(scope,SCOPE_FIELDS))
    throw Error('SEO GSC overlap pagination: bounded pages and scope required');
  const pageSize=scope.rowLimit??1000;
  if(!Number.isSafeInteger(pageSize)||pageSize<1||pageSize>1000)
    throw Error('SEO GSC overlap pagination: invalid page size');
  const rows=[];
  for(const [index,page] of pages.entries()){
    if(!dataOnly(page,PAGE_FIELDS)||
      !Object.hasOwn(page,'startRow')||
      !Object.hasOwn(page,'rows')||
      page.startRow!==index*pageSize||
      !isStrictDataArray(page.rows,pageSize))
      throw Error('SEO GSC overlap pagination: invalid offset or response');
    if(index<pages.length-1&&page.rows.length!==pageSize)
      throw Error('SEO GSC overlap pagination: intermediate page must be full');
    if(page.responseAggregationType!==undefined&&
      page.responseAggregationType!=='byPage')
      throw Error('SEO GSC overlap pagination: incompatible aggregation type');
    if(page.metadata!==undefined&&
      (!plain(page.metadata)||Reflect.ownKeys(page.metadata).length!==0))
      throw Error('SEO GSC overlap pagination: incomplete provider metadata');
    rows.push(...page.rows);
  }
  if(rows.length>4000)
    throw Error('SEO GSC overlap pagination: safety cap exceeded');
  // Revalidates *all* rows in one pass, rather than summing per-page unique
  // query counts (which would silently miss overlaps crossing a boundary).
  const normalized=reviewOfflineGscQueryPageOverlap(
    {rows,responseAggregationType:'byPage'},
    {...scope,rowLimit:4000}
  );
  const mayHaveMore=pages[pages.length-1].rows.length===pageSize;
  const status=mayHaveMore?'PARTIAL_COVERAGE_REVIEW_ONLY':
    normalized.summary.queriesOnMultiplePages>0?
      'POSSIBLE_QUERY_PAGE_OVERLAP_REVIEW':'NO_OVERLAP_IN_SUPPLIED_ROWS';
  return {
    ...normalized,
    contractVersion:'seo-gsc-query-page-pagination-offline-v2',
    sourceType:'operator_supplied_paginated_query_page_not_verified',
    pagination:{
      pagesReceived:pages.length,
      pageSize,
      lastPageRows:pages[pages.length-1].rows.length,
      rowsReceived:rows.length,
      mayHaveMore,
      maxPagesReached:pages.length===4,
      nextStartRow:mayHaveMore?pages.length*pageSize:null
    },
    summary:{
      ...normalized.summary,
      possibleTruncation:mayHaveMore
    },
    reviewStatus:status,
    caveats:[
      'Page offsets and cross-page query/page pairs were checked, but the supplied rows are not provider-authenticated.',
      'A full final page may indicate additional responses; never treat a partial batch as complete property traffic.',
      'No raw terms, URLs, reversible query identifiers, redirects or production permission are returned.'
    ]
  };
}
