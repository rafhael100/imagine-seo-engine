import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStaticAuditCliArgs as parse} from '../src/audit-cli-args.mjs';
test('valid options preserve strict flags independently of argument order',()=>{
  assert.deepEqual(parse(['--strict-public-head','dist','https://example.com/','--fail-on-warnings']),{
    target:'dist',siteUrl:'https://example.com/',strict:true,strictPublicHead:true,allowedLanguages:['pt-BR']
  });
  assert.equal(parse(['--fail-on-warnings']).strict,true);
  assert.equal(parse([]).target,'dist');
  assert.deepEqual(parse(['--multilingual','dist']).allowedLanguages,
    ['pt-BR','en-US','es-ES']);
  assert.deepEqual(parse(['dist','--multilingual','https://example.com/']).allowedLanguages,
    ['pt-BR','en-US','es-ES']);
});
test('unknown, repeated and surplus flags are rejected before any audit',()=>{
  for(const args of [
    ['--fail-on-warning'],['--multilingual','--multilingual'],['--strict-public-head','--strict-public-head'],
    ['a','b','c'],['--'],['-v'],[1]
  ])assert.throws(()=>parse(args),/SEO audit CLI:/);
});
