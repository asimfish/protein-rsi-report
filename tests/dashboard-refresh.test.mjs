import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

// Execute the shipped controller and its real click/change handlers. The DOM
// and HTTP responses are artificial fixtures, never experiment observations.
async function page(){
 const nodes=new Map();
 const make=tag=>({
  tag,children:[],textContent:'',dataset:{},style:{},value:'all',hidden:false,disabled:false,events:new Map(),
  append(...x){this.children.push(...x);},replaceChildren(...x){this.children=x;},
  setAttribute(){},addEventListener(type,handler){this.events.set(type,handler);},
  querySelectorAll(selector){return this.children.flatMap(n=>[...(n.tag===selector?[n]:[]),...n.querySelectorAll(selector)]);},
  async click(){return await this.events.get('click')?.({target:this,type:'click'});},
  async change(){return await this.events.get('change')?.({target:this,type:'change'});},scrollIntoView(){}
 });
 const get=id=>{if(!nodes.has(id))nodes.set(id,make('div'));return nodes.get(id);};
 const document={getElementById:get,createElement:make,querySelectorAll:selector=>selector==='[data-task]'?get('task-list').children:[]};
 const actual=JSON.parse(await readFile(new URL('../public/data/program-history.json',import.meta.url),'utf8'));
 const fresh=()=>{const p=structuredClone(actual);p.status='running';p.stage='fixed_development';p.execution.active=true;p.execution.checked_utc=p.source_updated_utc=new Date().toISOString();return p;};
 let next=fresh();
 const context=vm.createContext({document,location:{hostname:'asimfish.github.io'},Date,setInterval(){},AbortSignal:{timeout:()=>null},fetch:async()=>({ok:next!==503,headers:{get:()=>null},json:async()=>structuredClone(next)})});
 for(const file of ['program-model.js','dashboard-state.js']){
  const s=await readFile(new URL('../public/'+file,import.meta.url),'utf8');vm.runInContext(s.replace(/^export /gm,''),context);
 }
 const s=await readFile(new URL('../public/program.js',import.meta.url),'utf8');
 await vm.runInContext('(async()=>{'+s.replace(/^import .*;\n/gm,'')+'})()',context);
 return{get,fresh,async refresh(value){next=value;await get('refresh').click();}};
}
test('Failed refresh cannot restore old running badges through selection or table filtering',async()=>{
 const p=await page();
 assert.match(p.get('program-state').textContent,/执行中/);
 const count=p.get('program-episodes').textContent;
 await p.refresh(503);assert.equal(p.get('program-state').textContent,'公开记录暂不可用');
 await p.get('task-list').children.find(b=>b.dataset.task==='fixed').click();
 assert.equal(p.get('selected-status').textContent,'状态待核对');
 p.get('task-filter').value='fixed';await p.get('task-filter').change();
 assert.equal(p.get('task-matrix').children[0].children[3].textContent,'待核对');
 assert.equal(p.get('program-episodes').textContent,count);
 await p.refresh(p.fresh());
 assert.match(p.get('program-state').textContent,/执行中/);
 assert.equal(p.get('selected-status').textContent,'进行中');
 assert.equal(p.get('task-matrix').children[0].children[3].textContent,'进行中');
});
