import test from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,readFile,writeFile} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {updateProgram} from '../scripts/update-program.mjs';
const sample=async()=>JSON.parse(await readFile(new URL('../public/data/program-history.json',import.meta.url),'utf8'));
test('Program updater preserves old snapshot on fallback, invalid or failed source',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'program-progress-'));const p=join(dir,'progress.json');await writeFile(p,'original');
 for(const r of [new Response('{}',{status:503}),new Response(JSON.stringify(await sample()),{headers:{'x-snapshot-source':'packaged'}}),new Response('{}'),new Response(JSON.stringify(await sample())),new Response(JSON.stringify(await sample()),{headers:{'x-snapshot-source':'unknown'}})]){await assert.rejects(updateProgram(async()=>r,p));assert.equal(await readFile(p,'utf8'),'original');}
 const data=await sample();await updateProgram(async()=>new Response(JSON.stringify(data),{headers:{'x-snapshot-source':'live-store'}}),p);assert.deepEqual(JSON.parse(await readFile(p,'utf8')),data);
});
