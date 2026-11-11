/**
 * SEO-F4 — comparar duas exportações autorizadas e locais do Search Console.
 * Não prevê posição, não acessa Google e não expõe consultas brutas.
 */
import {analyzeQueryExport} from './opportunities.mjs';
import {gscDay as day} from './gsc-period.mjs';

const round=(v,d=4)=>Math.round((v+Number.EPSILON)*10**d)/10**d;
const delta=(current,previous)=>previous>0?round((current-previous)/previous,3):null;

export function compareGscPeriods(previousRaw,currentRaw,options={}){
  if (!previousRaw||!currentRaw)throw new Error('SEO trend: two data exports required');
  const previous=analyzeQueryExport(previousRaw,options);
  const current=analyzeQueryExport(currentRaw,options);
  const prevFrom=day(previous.period.startDate),prevTo=day(previous.period.endDate);
  const curFrom=day(current.period.startDate),curTo=day(current.period.endDate);
  const days=prevTo-prevFrom+1;
  if(days<=0 || days!==curTo-curFrom+1 || days>92) {
    throw new Error('SEO trend: compare equal windows between 1 and 92 days');
  }
  if(curFrom<=prevTo)throw new Error('SEO trend: current period must follow previous without overlap');
  const oldRows=new Map(previous.clusters.map(x=>[x.segment+':'+x.cluster,x]));
  const newRows=new Map(current.clusters.map(x=>[x.segment+':'+x.cluster,x]));
  const keys=new Set([...oldRows.keys(),...newRows.keys()]);
  const changes=[...keys].map(key=>{
    const old=oldRows.get(key),now=newRows.get(key);
    const impressionsBefore=old?.impressions??0,impressionsAfter=now?.impressions??0;
    const clicksBefore=old?.clicks??0,clicksAfter=now?.clicks??0;
    const ctrBefore=old?.ctr??0,ctrAfter=now?.ctr??0;
    const posBefore=old?.averagePosition??null,posAfter=now?.averagePosition??null;
    const signals=[];
    // Apenas sinais de revisão. Limiares reduzem alarmes de baixo volume.
    if(impressionsBefore>=200&&impressionsAfter<impressionsBefore*.7)
      signals.push('investigate_impressions_drop');
    if(clicksBefore>=20&&clicksAfter<clicksBefore*.75)
      signals.push('investigate_clicks_drop');
    if(impressionsBefore>=100&&impressionsAfter>=100 &&
       ctrBefore-ctrAfter>=.02)
      signals.push('investigate_ctr_drop');
    if(impressionsBefore>=100&&impressionsAfter>=100 &&
       posBefore!==null&&posAfter!==null&&posAfter-posBefore>=3)
      signals.push('investigate_average_position_decline');
    if(impressionsBefore===0&&impressionsAfter>=100)
      signals.push('new_visible_cluster');
    return {
      segment:now?.segment??old?.segment,
      cluster:now?.cluster??old?.cluster,
      impressions:{previous:impressionsBefore,current:impressionsAfter,changePct:delta(impressionsAfter,impressionsBefore)},
      clicks:{previous:clicksBefore,current:clicksAfter,changePct:delta(clicksAfter,clicksBefore)},
      ctrChangePercentagePoints:round((ctrAfter-ctrBefore)*100,2),
      averagePositionChange:posBefore!==null&&posAfter!==null?round(posAfter-posBefore,2):null,
      signals
    };
  }).sort((a,b)=>{
    const ar=a.signals.length,br=b.signals.length;
    return br-ar||b.impressions.current-a.impressions.current||a.cluster.localeCompare(b.cluster);
  });
  const summary={
    days,
    previous:{clicks:previous.summary.clicks,impressions:previous.summary.impressions},
    current:{clicks:current.summary.clicks,impressions:current.summary.impressions},
    clicksChangePct:delta(current.summary.clicks,previous.summary.clicks),
    impressionsChangePct:delta(current.summary.impressions,previous.summary.impressions),
    redactedRows:previous.summary.redactedRows+current.summary.redactedRows,
    flaggedClusters:changes.filter(x=>x.signals.length>0).length
  };
  return {
    dataSource:'two_user_provided_search_analytics_exports_not_verified',
    previousPeriod:previous.period,currentPeriod:current.period,
    summary,changes,
    limitations:[
      'Query rows may be anonymized/truncated; these are only the rows provided, not all property traffic.',
      'Average position varies by search, device, country and query mix; positive delta means a worse average.',
      'Changes are correlations, not evidence of causation, business impact or guaranteed ranks.',
      'No alerts, publication or external Google queries are performed by this offline function.'
    ]
  };
}
