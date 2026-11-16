/**
 * SEO F111 — STRICT offline converter of a locally supplied IBGE-style
 * Localidades v1 /municipios JSON export into the F110 reference contract.
 *
 * This code NEVER fetches IBGE, proves TLS provenance, validates a digital
 * signature, verifies completeness or authorizes publishing. The source
 * label remains explicitly operator-supplied and unverified.
 */
const UF_PREFIX=Object.freeze({
  RO:'11',AC:'12',AM:'13',RR:'14',PA:'15',AP:'16',TO:'17',
  MA:'21',PI:'22',CE:'23',RN:'24',PB:'25',PE:'26',AL:'27',SE:'28',BA:'29',
  MG:'31',ES:'32',RJ:'33',SP:'35',PR:'41',SC:'42',RS:'43',
  MS:'50',MT:'51',GO:'52',DF:'53'
});
const ROW_FIELDS=new Set(['id','nome','microrregiao','regiao-imediata']);
const FORBIDDEN=new Set(['__proto__','prototype','constructor']);
function safePlain(value,maxKeys=16){
  if(value===null||typeof value!=='object'||Array.isArray(value)||
    ![Object.prototype,null].includes(Object.getPrototypeOf(value)))
    return false;
  const keys=Reflect.ownKeys(value);
  return keys.length<=maxKeys&&keys.every(k=>{
    if(typeof k!=='string'||FORBIDDEN.has(k))return false;
    const d=Object.getOwnPropertyDescriptor(value,k);
    return d?.enumerable===true&&Object.hasOwn(d,'value');
  });
}
function dense(value){
  if(!Array.isArray(value)||Object.getPrototypeOf(value)!==Array.prototype||
    value.length<1||value.length>6000)return false;
  const keys=Reflect.ownKeys(value);
  if(keys.length!==value.length+1)return false;
  for(let i=0;i<value.length;i++){
    const d=Object.getOwnPropertyDescriptor(value,String(i));
    if(d?.enumerable!==true||!Object.hasOwn(d,'value'))return false;
  }
  return true;
}
function exactRow(row){
  if(!safePlain(row,4) ||
    !Object.hasOwn(row,'id') || !Object.hasOwn(row,'nome') ||
    !(Object.hasOwn(row,'regiao-imediata')||
      Object.hasOwn(row,'microrregiao')))return false;
  return Reflect.ownKeys(row).every(k=>ROW_FIELDS.has(k));
}
function getUf(row,chain){
  let node=row;
  for(const key of chain){
    if(!safePlain(node)||!Object.hasOwn(node,key))return null;
    node=node[key];
  }
  return typeof node==='string'&&Object.hasOwn(UF_PREFIX,node)?node:null;
}

/**
 * Returns exactly F110's sourceType and entries.
 * Consuming this output is NOT equivalent to verifying that it came from IBGE.
 */
export function normalizeLocallySuppliedIbgeMunicipalities(raw){
  if(!dense(raw))throw Error('SEO F111: invalid bounded municipality export');
  const entries=[],seen=new Set();
  for(const row of raw){
    if(!exactRow(row)||!Number.isSafeInteger(row.id)||
       row.id<1000000||row.id>9999999||
       typeof row.nome!=='string'||row.nome.trim()!==row.nome||
       row.nome.length<2||row.nome.length>120||
       /[\u0000-\u001f\u007f<>]/.test(row.nome))
      throw Error('SEO F111: malformed municipality record');

    const code=String(row.id);
    let immed=null,micro=null;
    if(Object.hasOwn(row,'regiao-imediata') &&
       row['regiao-imediata']!==null){
      immed=getUf(row,['regiao-imediata','regiao-intermediaria','UF','sigla']);
      if(immed===null)throw Error('SEO F111: malformed UF hierarchy');
    }
    if(Object.hasOwn(row,'microrregiao') &&
       row.microrregiao!==null){
      micro=getUf(row,['microrregiao','mesorregiao','UF','sigla']);
      if(micro===null)throw Error('SEO F111: malformed UF hierarchy');
    }
    if(immed!==null&&micro!==null&&immed!==micro)
      throw Error('SEO F111: inconsistent UF hierarchies');
    const uf=immed??micro;
    if(uf===null||!code.startsWith(UF_PREFIX[uf]))
      throw Error('SEO F111: incompatible municipality UF prefix');
    if(seen.has(code))
      throw Error('SEO F111: duplicate municipality geocode');
    seen.add(code);
    entries.push({ibgeCode:code,state:uf,city:row.nome});
  }
  entries.sort((a,b)=>a.ibgeCode.localeCompare(b.ibgeCode));
  return {
    sourceType:'operator_supplied_municipality_reference_unverified',
    entries
  };
}
