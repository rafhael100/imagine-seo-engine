/**
 * SEO-F56 — Reuse validated F54 date trends in the existing SEO Brief v1
 * contract consumed by the Portal. Partial windows are withheld entirely
 * from customer-facing organic fields and review action candidates.
 */
import {buildOfflineSeoBrief} from './seo-brief.mjs';
import {compareOfflineGscDailyPeriods} from './gsc-daily-compare.mjs';

const plain=x=>x!==null&&typeof x==='object'&&!Array.isArray(x)&&
  [Object.prototype,null].includes(Object.getPrototypeOf(x));
const allowed=new Set(['audit','comparisonInput']);
const actionMap=Object.freeze({
  review_impression_drop:'review_impression_drop',
  review_click_drop:'review_click_drop',
  review_ctr_drop:'review_ctr_drop',
  review_average_position_decline:'review_average_position'
});
const priority=Object.freeze({critical:0,high:1,medium:2,low:3});

export function buildOfflineDailySeoBrief(input){
  if(!plain(input)||Reflect.ownKeys(input).length!==allowed.size||
    Reflect.ownKeys(input).some(key=>typeof key!=='string'||
      !allowed.has(key)||
      !Object.hasOwn(Object.getOwnPropertyDescriptor(input,key),'value')))
    throw Error('SEO daily brief: exact audit and comparison required');
  const technical=buildOfflineSeoBrief({audit:input.audit});
  const comparison=compareOfflineGscDailyPeriods(input.comparisonInput);
  if(!comparison.coverageComplete){
    return {
      ...technical,
      limitations:[
        ...technical.limitations,
        'Daily Search Console comparison was withheld because date coverage is incomplete or pagination may remain.'
      ]
    };
  }
  const extra=[...new Set(comparison.reviewSignals)].map(signal=>{
    if(!Object.hasOwn(actionMap,signal))
      throw Error('SEO daily brief: unknown trend review signal');
    return {code:actionMap[signal],priority:'medium',count:1};
  });
  const merged=new Map(technical.recommendedReviews.map(review=>[review.code,review]));
  for(const entry of extra){
    if(!merged.has(entry.code))merged.set(entry.code,entry);
  }
  return {
    ...technical,
    organic:{
      days:comparison.comparisonDays,
      previous:{
        clicks:comparison.previous.clicks,
        impressions:comparison.previous.impressions
      },
      current:{
        clicks:comparison.current.clicks,
        impressions:comparison.current.impressions
      },
      clicksChangeFraction:comparison.change.clicksFraction,
      impressionsChangeFraction:comparison.change.impressionsFraction
    },
    recommendedReviews:[...merged.values()].sort((a,b)=>
      priority[a.priority]-priority[b.priority]||b.count-a.count||
      a.code.localeCompare(b.code)),
    limitations:[
      ...technical.limitations,
      'All date rows were returned in the supplied windows; this is not proof that Google reported complete property traffic.'
    ]
  };
}
