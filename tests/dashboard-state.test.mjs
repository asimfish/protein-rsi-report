import test from 'node:test';
import assert from 'node:assert/strict';
import {executionView,stageView,confirmationView} from '../public/dashboard-state.js';
// Artificial state fixtures must not depend on the phase of a live experiment.
const sample=()=>({status:'running',stage:'confirmation',
 source_updated_utc:'2026-10-13T01:00:00Z',
 execution:{active:true,checked_utc:'2026-10-13T01:00:00Z'},
 counts:{episodes_started:440,episodes_completed:440,episodes_failed:0}});
const now=Date.parse('2026-10-13T01:00:00Z');
test('Paused records remain paused when counters are old but process is recently confirmed stopped',()=>{
 const p=sample();p.status='paused';p.stage='fixed_development';p.source_updated_utc='2026-10-12T10:00:00Z';p.execution.checked_utc=new Date(now).toISOString();p.execution.active=false;
 assert.equal(executionView(p,now).label,'已暂停');
 p.execution.active=true;assert.equal(executionView(p,now).kind,'unknown');
 p.execution.active=false;p.execution.checked_utc='2026-10-12T10:00:00Z';assert.match(executionView(p,now).label,/待核对/);
});
test('Fresh active process with stale counters cannot assert ongoing progress',()=>{
 const p=sample();p.status='running';p.execution.active=true;p.execution.checked_utc=new Date(now).toISOString();p.source_updated_utc='2026-10-12T10:00:00Z';
 assert.equal(executionView(p,now).kind,'unknown');
 assert.equal(stageView(p,now).rows.find(r=>r.id===p.stage).label,'待核对');
 p.source_updated_utc=new Date(now).toISOString();assert.equal(executionView(p,now).kind,'running');
});
test('Shared phase counts retain completed sanity and failed cell without treating failure as completion',()=>{
 const p=sample();p.status='paused';p.stage='fixed_development';p.counts.episodes_started=411;p.counts.episodes_completed=410;p.counts.episodes_failed=1;
 const v=stageView(p);assert.equal(v.engineering,10);assert.equal(v.fixed,400);assert.equal(v.rows[1].label,'已暂停');assert.equal(v.rows[3].label,'未开始');
});
test('Confirmation progress does not fabricate completed cells from the overall count',()=>{
 const p=sample();p.stage='fixed_development';assert.equal(confirmationView(p).label,'未开始');
 p.stage='confirmation';assert.equal(confirmationView(p).label,'进行中');assert.match(confirmationView(p).detail,/不推算/);
 p.stage=p.status='completed';assert.match(executionView(p).label,/科研结论待复核/);
});
