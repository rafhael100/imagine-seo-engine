/**
 * SEO-F11 — bounded offline assembly of user-provided Search Console pages.
 * No API calls are performed: paging responses must be supplied by a trusted
 * backend in a later phase. This does not authenticate that backend.
 */
import {analyzeQueryExport} from './opportunities.mjs';
import {analyzeGscQueryResponse} from './gsc-readonly.mjs';

export function analyzeGscPaginatedResponses(pages,plan,{maxPages=4,maxRows=50000}={}){
  if(!Array.isArray(pages)||pages.length===0)
    throw Error('SEO GSC pagination: at least one page required');
  if(!Number.isSafeInteger(maxPages)||maxPages<1||maxPages>4||
    !Number.isSafeInteger(maxRows)||maxRows<1||maxRows>50000)
    throw Error('SEO GSC pagination: invalid safety limits');
  // Reuse the plan and period checks without trusting the pages.
  const validated=analyzeGscQueryResponse({rows:[]},plan);
  const rowLimit=plan.body.rowLimit;
  if(plan.body.startRow!==0)
    throw Error('SEO GSC pagination: complete query assembly must start at zero');
  if(pages.length>maxPages)
    throw Error('SEO GSC pagination: too many response pages');
  const merged=[],queries=new Set();
  let previousClicks=Infinity;
  for(const [index,page] of pages.entries()){
    const expectedOffset=index*rowLimit;
    if(!page||typeof page!=='object'||Array.isArray(page)||
      page.startRow!==expectedOffset||!Array.isArray(page.rows)||
      page.rows.length>rowLimit)
      throw Error('SEO GSC pagination: invalid page order, offset or size');
    if(index<pages.length-1&&page.rows.length!==rowLimit)
      throw Error('SEO GSC pagination: incomplete intermediate page');
    if(page.responseAggregationType!==undefined &&
      page.responseAggregationType!=='byProperty')
      throw Error('SEO GSC pagination: unexpected aggregation type');
    if(page.metadata!==undefined &&
      (!page.metadata || typeof page.metadata!=='object' ||
        page.metadata.first_incomplete_date || page.metadata.first_incomplete_hour))
      throw Error('SEO GSC pagination: unexpected or incomplete metadata');
    for(const row of page.rows){
      if(!row||!Array.isArray(row.keys)||row.keys.length!==1||
        typeof row.keys[0]!=='string'||row.keys[0].length>500)
        throw Error('SEO GSC pagination: expected one query key');
      if(!Number.isSafeInteger(row.clicks)||row.clicks<0||row.clicks>previousClicks)
        throw Error('SEO GSC pagination: click order differs from provider contract');
      previousClicks=row.clicks;
      if(queries.has(row.keys[0]))
        throw Error('SEO GSC pagination: duplicated query across pages');
      queries.add(row.keys[0]);
      merged.push(row);
      if(merged.length>maxRows)
        throw Error('SEO GSC pagination: row safety cap exceeded');
    }
  }
  const last=pages[pages.length-1];
  const mayHaveMore=last.rows.length===rowLimit;
  const analyzed=analyzeQueryExport({
    dimensions:['query'],
    startDate:plan.body.startDate,
    endDate:plan.body.endDate,
    rows:merged
  });
  return {
    contractVersion:'seo-gsc-paginated-offline-v1',
    tenantRef:validated.tenantRef,
    propertyFingerprint:validated.propertyFingerprint,
    sourceType:'operator_supplied_api_pagination_not_verified',
    pagination:{
      pagesReceived:pages.length,rowsReceived:merged.length,
      mayHaveMore,sourceMayBeTruncated:true
    },
    ...analyzed,
    caveats:[
      'A complete page stream does not guarantee that Search Console returned all property queries.',
      'Source pages are not authenticated; authorization and quotas belong to the future Portal backend.',
      'Raw query text is only processed in memory and is omitted from the result.'
    ]
  };
}
