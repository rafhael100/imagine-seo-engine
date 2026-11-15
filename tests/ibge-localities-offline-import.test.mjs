import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLocallySuppliedIbgeMunicipalities as normalize}
  from '../src/ibge-localities-offline-import.mjs';

const uf=sigla=>({id:sigla==='CE'?23:26,sigla,nome:'Estado Exemplo'});
const immediate=sigla=>({
  id:230001,nome:'Região Exemplo',
  'regiao-intermediaria':{
    id:2301,nome:'Região Intermediária Exemplo',UF:uf(sigla)
  }
});
const micro=sigla=>({
  id:23001,nome:'Microrregião Exemplo',
  mesorregiao:{id:2301,nome:'Mesorregião Exemplo',UF:uf(sigla)}
});
const row=(id=2304400,name='Fortaleza',sigla='CE')=>({
  id,nome:name,'regiao-imediata':immediate(sigla),microrregiao:micro(sigla)
});
test('normalizes the common IBGE Localidades v1 municipality hierarchy safely',()=>{
  const result=normalize([
    row(2611606,'Recife','PE'),
    row(2304400,'Fortaleza','CE')
  ]);
  assert.equal(result.sourceType,'operator_supplied_municipality_reference_unverified');
  assert.deepEqual(result.entries,[
    {ibgeCode:'2304400',state:'CE',city:'Fortaleza'},
    {ibgeCode:'2611606',state:'PE',city:'Recife'}
  ]);
  assert.ok(!Object.hasOwn(result,'officiallyVerified'));
  assert.doesNotMatch(JSON.stringify(result),/regiao-imediata|mesorregiao/);
});
test('supports one documented hierarchy when the other is absent',()=>{
  const i=row();delete i.microrregiao;
  const m=row();delete m['regiao-imediata'];
  const a=normalize([i]),b=normalize([m]);
  assert.deepEqual(a.entries,b.entries);
});
test('fails closed on UF mismatch between hierarchy branches and code prefix',()=>{
  const mismatched=row();
  mismatched.microrregiao= micro('PE');
  assert.throws(()=>normalize([mismatched]),/inconsistent UF hierarchies/);
  assert.throws(()=>normalize([row(2304400,'Fortaleza','PE')]),
    /incompatible municipality UF prefix/);
});
test('rejects duplicate geocodes and untrusted fields, strings and secret payloads',()=>{
  assert.throws(()=>normalize([row(),row()]),/duplicate municipality geocode/);
  const cases=[
    [{...row(),providerVerified:true}],
    [{...row(),id:'2304400'}],
    [{...row(),nome:'<script>private</script>'}],
    [{...row(),nome:'   '}],
    [{...row(),nome:'Fortaleza\nINVASION'}],
    [{id:2304400,nome:'Fortaleza',UF:uf('CE')}],
    [{...row(),microrregiao:null}],
    [row(2304400,'Fortaleza','CE'),row(2304400,'Outro Nome','CE')]
  ];
  for(const invalid of cases)
    assert.throws(()=>normalize(invalid),/SEO F111/);
});
test('rejects accessors, symbols, sparse arrays and huge files',()=>{
  const getter=row();
  Object.defineProperty(getter,'nome',{
    enumerable:true,get(){throw Error('PRIVATE_SEO_SECRET');}
  });
  assert.throws(()=>normalize([getter]),/SEO F111/);
  const sym=row();sym[Symbol('admin')]='privileged';
  assert.throws(()=>normalize([sym]),/SEO F111/);
  const sparse=new Array(2);sparse[0]=row();
  assert.throws(()=>normalize(sparse),/SEO F111/);
  const big=Array.from({length:6001},(_,i)=>row(2300000+i));
  assert.throws(()=>normalize(big),/SEO F111/);
});
test('handles several thousand entries without claiming genuine origin',()=>{
  const synthetic=Array.from({length:5700},(_,i)=>row(
    2300000+i,'Municipio Sintetico '+i
  ));
  const result=normalize(synthetic);
  assert.equal(result.entries.length,5700);
  assert.equal(result.sourceType,
    'operator_supplied_municipality_reference_unverified');
  assert.equal(result.entries[0].ibgeCode,'2300000');
  assert.equal(result.entries.at(-1).ibgeCode,'2305699');
});
