import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Run the shipped app and its actual refresh callback with an isolated DOM and
// local responses. This checks both consumers, including the failed-fetch path.
async function page(){
  const nodes=new Map();
  const node=()=>({textContent:'',children:[],classList:{add(){}},append(...xs){this.children.push(...xs);},replaceChildren(){this.children=[];},setAttribute(){}});
  const get=id=>{if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);};
  const document={getElementById:get,createElement:node,createElementNS:node,querySelectorAll:()=>[]};
  const payload=JSON.parse(await readFile(new URL('../public/data/progress.json',import.meta.url),'utf8'));
  let now=Date.parse('2026-10-11T06:00:00Z'),next;
  const fresh=()=>{const p=structuredClone(payload);p.execution.active=true;p.execution.checked_utc=p.source_updated_utc=new Date(now).toISOString();p.execution.note='人工运行快照';return p;};
  next=fresh();
  class Clock extends Date{static now(){return now;}}
  let refresh;
  const context=vm.createContext({document,Date:Clock,setInterval:fn=>{refresh=fn;},fetch:async path=>path==='data/progress.json'?{ok:next!==503,json:async()=>structuredClone(next)}:{ok:false}});
  const modelSource=await readFile(new URL('../public/model.js',import.meta.url),'utf8');
  vm.runInContext(modelSource.replace(/^export /gm,''),context,{filename:'public/model.js'});
  const source=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
  vm.runInContext(source.replace(/^import .*?;\n/,''),context,{filename:'public/app.js'});
  await new Promise(setImmediate);
  return{get,fresh,async show(value){next=value;await refresh();},advance(ms){now+=ms;}};
}

test('Both visible statuses stop asserting execution when source or process check expires',async()=>{
  const p=await page();
  assert.equal(p.get('outer-status').textContent,'执行中');
  assert.match(p.get('runtime-state').textContent,/正式研究执行中/);
  p.advance(16*60000);
  // Keep the previously active snapshot, as an exporter outage would do.
  const old=p.fresh();old.source_updated_utc='2026-10-11T06:00:00Z';
  await p.show(old);
  assert.match(p.get('runtime-state').textContent,/已过期/);
  assert.equal(p.get('outer-status').textContent,'待确认');
  assert.match(p.get('outer-progress').textContent,/不能确认当前运行/);
  const staleCheck=p.fresh();staleCheck.execution.checked_utc='2026-10-11T06:00:00Z';
  await p.show(staleCheck);
  assert.match(p.get('runtime-state').textContent,/待本机核验/);
  assert.equal(p.get('outer-status').textContent,'待确认');
  assert.doesNotMatch(p.get('outer-progress').textContent,/人工运行快照/);
});

test('A 503 or invalid refresh clears the prior running milestone and explains retained counts',async()=>{
  for(const response of [503,{schema_version:1}]){
    const p=await page();
    assert.equal(p.get('outer-status').textContent,'执行中');
    const count=p.get('episodes').textContent;
    await p.show(response);
    assert.equal(p.get('runtime-state').textContent,'执行快照不可用');
    assert.equal(p.get('outer-status').textContent,'待确认');
    assert.match(p.get('outer-progress').textContent,/无法确认当前运行/);
    assert.match(p.get('runtime-detail').textContent,/最后可用记录/);
    assert.doesNotMatch(p.get('outer-progress').textContent,/人工运行快照/);
    assert.equal(p.get('episodes').textContent,count);
  }
});
