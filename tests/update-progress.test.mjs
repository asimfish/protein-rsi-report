import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {publicSnapshot,updateProgress,SOURCE} from '../scripts/update-progress.mjs';

const example=()=>readFile(new URL('../public/data/progress.json',import.meta.url),'utf8').then(JSON.parse);

test('Sync retains measured timestamps, failures and unsettled costs, without adding runtime claims',async()=>{
  const original=await example();
  const result=publicSnapshot(original);
  assert.deepEqual(result,original);
  original.api_key='synthetic private field';original.counts.labels=['synthetic'];
  const projected=publicSnapshot(original);
  assert.equal('api_key' in projected,false);
  assert.equal('labels' in projected.counts,false);
});

test('Public sync writes the validated source snapshot without replacing its timestamp',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'protein-report-'));
  try{
    const file=join(directory,'progress.json'),value=await example();
    await writeFile(file,'previous');
    let requested;
    await updateProgress(async(url,options)=>{
      requested=url;assert.equal(options.redirect,'error');
      return new Response(JSON.stringify(value));
    },file);
    assert.equal(requested,SOURCE);
    assert.deepEqual(JSON.parse(await readFile(file,'utf8')),value);
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('Unavailable or invalid source leaves the existing snapshot intact',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'protein-report-'));
  try{
    const file=join(directory,'progress.json');
    for(const response of [new Response('',{status:503}),new Response('{"schema_version":1}')]){
      await writeFile(file,'previous');
      await assert.rejects(updateProgress(async()=>response,file));
      assert.equal(await readFile(file,'utf8'),'previous');
    }
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('HTTP 200 packaged fallback cannot replace a newer known execution snapshot',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'protein-report-'));
  try{
    const file=join(directory,'progress.json');
    const previous=await readFile(new URL('../public/data/progress.json',import.meta.url));
    await writeFile(file,previous);
    const older=await example();
    older.source_updated_utc='2026-10-11T07:36:13.008151+00:00';
    older.counts.episodes_completed=4;
    older.counts.known_label_queries=784;
    older.counts.recorded_model_requests=41;
    older.counts.model_responses_completed=27;
    older.counts.model_attempts_failed=13;
    older.counts.model_attempts_unsettled=1;
    const response=new Response(JSON.stringify(older),{
      headers:{'x-snapshot-source':'packaged','Content-Type':'application/json'}
    });
    assert.equal(response.status,200);
    await assert.rejects(updateProgress(async()=>response,file),/packaged fallback/);
    assert.deepEqual(await readFile(file),previous);
  }finally{await rm(directory,{recursive:true,force:true});}
});

test('Incomplete cost accounting or an unsupported scientific claim cannot be published',async()=>{
  for(const change of [p=>p.counts.model_responses_completed+=1,p=>p.scientific_support=true]){
    const value=await example();change(value);
    assert.throws(()=>publicSnapshot(value),/Invalid public execution snapshot/);
  }
});
