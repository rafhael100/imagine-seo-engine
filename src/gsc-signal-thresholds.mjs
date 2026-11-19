/**
 * Review thresholds must use original integer counters, not rounded percent
 * displays or floating-point multiplication. Safe Number counters may still
 * yield an inexact product. These functions do not fetch any GSC data.
 */
function belowFraction(previous,current,numerator,denominator){
 if(!Number.isSafeInteger(previous)||previous<0||
    !Number.isSafeInteger(current)||current<0)
  throw new TypeError('SEO GSC drop: safe nonnegative counters required');
 return BigInt(current)*BigInt(denominator)<
   BigInt(previous)*BigInt(numerator);
}
// Strictly more than 30%/25% drop. Exact equality must not alert.
export const hasImpressionDropAboveThirtyPercent=(previous,current)=>
 belowFraction(previous,current,7,10);
export const hasClickDropAboveTwentyFivePercent=(previous,current)=>
 belowFraction(previous,current,3,4);
