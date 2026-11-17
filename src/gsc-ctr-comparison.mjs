/**
 * Compare the existing two-percentage-point CTR decline threshold using
 * original counters. Rounded display ratios must not decide review signals.
 * BigInt keeps cross-products exact even when their factors are safe Numbers
 * but their products exceed Number.MAX_SAFE_INTEGER. No BigInt is returned.
 */
export function hasCtrDropOfTwoPercentagePoints(
  previousClicks,previousImpressions,currentClicks,currentImpressions
){
  const counts=[previousClicks,previousImpressions,currentClicks,currentImpressions];
  if(counts.some(value=>!Number.isSafeInteger(value)||value<0)||
    previousClicks>previousImpressions||currentClicks>currentImpressions)
    throw Error('SEO GSC CTR: valid counters required');
  if(previousImpressions===0||currentImpressions===0)return false;
  const beforeClicks=BigInt(previousClicks),beforeImpressions=BigInt(previousImpressions);
  const afterClicks=BigInt(currentClicks),afterImpressions=BigInt(currentImpressions);
  // (beforeClicks/beforeImpressions - afterClicks/afterImpressions) >= 1/50.
  return 50n*(beforeClicks*afterImpressions-afterClicks*beforeImpressions)>=
    beforeImpressions*afterImpressions;
}
