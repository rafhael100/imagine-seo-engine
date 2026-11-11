import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const banned=[
  {code:'network_call',re:/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(/},
  {code:'network_builtin_import',re:/\b(?:from|import)\s*['"](?:node:)?(?:https?|net|tls|dns|dgram|http2|undici)(?:\/[^'"]*)?['"]/},
  {code:'dynamic_network_import',re:/\b(?:import|require)\s*\(\s*['"](?:node:)?(?:https?|net|tls|dns|dgram|http2|undici)(?:\/[^'"]*)?['"]/}
];
function violations(source){
  return banned.filter(rule=>rule.re.test(source)).map(rule=>rule.code);
}
test('F77 scans offline source modules against accidental network introductions',()=>{
  for(const folder of ['src','scripts']){
    for(const entry of readdirSync(join(root,folder),{withFileTypes:true})){
      if(!entry.name.endsWith('.mjs'))continue;
      assert.equal(entry.isFile(),true,'unexpected module type: '+entry.name);
      const source=readFileSync(join(root,folder,entry.name),'utf8');
      assert.deepEqual(violations(source),[],
        'offline network policy regression: '+folder+'/'+entry.name);
    }
  }
});
test('F77 rejects representative network APIs while permitting local I/O',()=>{
  for(const source of [
    "await fetch('https://example.invalid')",
    "const ws = new WebSocket('wss://example.invalid')",
    "import http from 'node:http'",
    "const tls = await import('node:tls')",
    "const dns = require('dns/promises')"
  ])assert.ok(violations(source).length>0);
  for(const source of [
    "import {readFile} from 'node:fs/promises'",
    "const url = new URL('https://example.invalid')",
    "const file = await readFile('./local.json','utf8')"
  ])assert.deepEqual(violations(source),[]);
});
