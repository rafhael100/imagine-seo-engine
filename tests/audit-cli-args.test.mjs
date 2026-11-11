import test from 'node:test';
import assert from 'node:assert/strict';
import {parseStaticAuditCliArgs as parse} from '../src/audit-cli-args.mjs';
test('valid options preserve strict flags independently of argument order',()=>{
  assert.deepEqual(parse(['--strict-public-head','dist','https://example.com/','--fail-on-warnings']),{
    target:'dist',siteUrl:'https://example.com/',strict:true,strictPublicHead:true
  });
  assert.equal(parse(['--fail-on-warnings']).strict,true);
  assert.equal(parse([]).target,'dist');
});
test('unknown, repeated and surplus flags are rejected before any audit',()=>{
  for(const args of [
    ['--fail-on-warning'],['--strict-public-head','--strict-public-head'],
    ['a','b','c'],['--'],['-v'],[1]
  ])assert.throws(()=>parse(args),/SEO audit CLI:/);
});
