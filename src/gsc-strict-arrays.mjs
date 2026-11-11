/**
 * SEO-F61 — accept only dense, ordinary, own-data arrays in untrusted
 * operator-supplied GSC fixtures. Reject getters, prototypes, hidden keys,
 * symbols, holes and unexpected own iterator overrides before iteration.
 *
 * This is a JSON-style data boundary, not a generic defense from JavaScript
 * Proxy traps. Backends must parse data from trusted serializers.
 */
export function isStrictDataArray(value,maxLength=4000){
  if(!Array.isArray(value)||
    Object.getPrototypeOf(value)!==Array.prototype||
    !Number.isSafeInteger(maxLength)||maxLength<0||
    !Number.isSafeInteger(value.length)||value.length>maxLength)
    return false;
  const own=Reflect.ownKeys(value);
  if(own.length!==value.length+1)return false;
  const length=Object.getOwnPropertyDescriptor(value,'length');
  if(!length||!Object.hasOwn(length,'value')||length.value!==value.length)
    return false;
  for(let i=0;i<value.length;i++){
    const descriptor=Object.getOwnPropertyDescriptor(value,String(i));
    if(!descriptor||!Object.hasOwn(descriptor,'value'))return false;
  }
  return true;
}
