import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const script=new URL('../scripts/qa-comercial-private-preview-leak-mutation.mjs',import.meta.url);
function run(args,env={}){
  return spawnSync(process.execPath,[script.pathname,...args],{
    encoding:'utf8',timeout:10000,maxBuffer:128*1024,
    env:{...process.env,GITHUB_ACTIONS:'false',...env}
  });
}
test('F115 mutation refuses local execution without disposable Actions context',()=>{
  const p=run(['/tmp/private-client-file.html']);
  assert.notEqual(p.status,0);
  assert.match(p.stderr,/disposable Actions build path required/);
  assert.doesNotMatch(p.stderr,/private-client-file/);
});
test('F115 mutation refuses unsupported paths before accessing any HTML',()=>{
  const p=run(['/tmp/private-client-file.html'],{GITHUB_ACTIONS:'true'});
  assert.notEqual(p.status,0);
  assert.match(p.stderr,/unauthorized build directory/);
  assert.doesNotMatch(p.stderr,/private-client-file/);
});
test('F115 mutation requires exactly one isolated dist argument',()=>{
  const p=run(['.qa/comercial-i18n/dist','--publish'],{GITHUB_ACTIONS:'true'});
  assert.notEqual(p.status,0);
  assert.match(p.stderr,/disposable Actions build path required/);
});
