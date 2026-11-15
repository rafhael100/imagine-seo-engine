import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

/**
 * F82 — no GSC report or comparison CLI may silently accept extra flags.
 * Names are synthetic and never correspond to a real customer or property.
 */
const cases=[
  ['report-gsc-offline.mjs',['PRIVATE-F82.json']],
  ['report-gsc-csv-offline.mjs',
    ['PRIVATE-F82.csv','2026-10-01','2026-10-07']],
  ['compare-gsc-offline.mjs',['PRIVATE-F82-old.json','PRIVATE-F82-new.json']],
  ['compare-gsc-csv-offline.mjs',
    ['PRIVATE-F82-old.csv','2026-10-01','2026-10-07',
     'PRIVATE-F82-new.csv','2026-10-08','2026-10-14']]
];
const run=(script,args)=>{
  const path=fileURLToPath(new URL('../scripts/'+script,import.meta.url));
  return spawnSync(process.execPath,[path,...args],{
    encoding:'utf8',timeout:15000,maxBuffer:1024*1024
  });
};
for(const [script,required] of cases){
  test('F82 '+script+' refuses unexpected flags before reading private evidence',()=>{
    for(const extra of [
      ['--publish'],['--allow-unsafe-query'],['SECOND-PRIVATE-F82.json']
    ]){
      const out=run(script,[...required,...extra]);
      assert.equal(out.status,2,script+' should fail usage gate for extra args');
      assert.equal(out.stdout,'');
      assert.match(out.stderr,/Usage: node scripts\//);
      assert.doesNotMatch(out.stdout+out.stderr,
        /PRIVATE-F82|SECOND-PRIVATE|customer@example\.com|SYNTHETIC-SECRET/);
    }
    const none=run(script,[]);
    assert.equal(none.status,2);
    assert.equal(none.stdout,'');
    assert.match(none.stderr,/Usage: node scripts\//);
  });
}
