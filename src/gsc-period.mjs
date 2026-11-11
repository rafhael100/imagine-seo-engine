/** Date integrity for manually supplied GSC periods; no clock or Google dependency. */
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
export function gscDay(value) {
  if (typeof value !== 'string' || !ISO_DAY.test(value)) throw Error('GSC: invalid calendar date');
  const millis=Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(millis) || new Date(millis).toISOString().slice(0,10)!==value)
    throw Error('GSC: invalid calendar date');
  return Math.floor(millis/86400000);
}
export function validateGscPeriod(startDate,endDate,{maxDays=92}={}) {
  const start=gscDay(startDate), end=gscDay(endDate);
  const days=end-start+1;
  if (!Number.isSafeInteger(days) || days<1 || days>maxDays)
    throw Error('GSC: reporting period must be 1 to '+maxDays+' days in ascending order');
  return {startDate,endDate,days,startDay:start,endDay:end};
}
