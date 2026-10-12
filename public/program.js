import {validateProgram} from './program-model.js';
import {stageNames,executionView,stageView,confirmationView} from './dashboard-state.js';
const $=id=>document.getElementById(id),number=n=>n.toLocaleString('zh-CN');
const time=s=>new Date(s).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai',hour12:false});
const tasks=[
 {id:'overview',name:'当前研究 · 总体进度',short:'当前研究',sub:'阶段、进度与需要关注的事项',type:'overview',description:'本轮先检验可执行策略和历史反馈机制。改进程序自修改、旧/新版能力评价属于下一阶段。'},
 {id:'none',name:'无历史',short:'无历史',sub:'none · 历史贡献的对照',type:'history',description:'四个历史槽为空，当前父代和本次已测诊断保持真实。用于判断详细修改历史是否带来增益。',role:'检验历史记录的贡献'},
 {id:'extreme',name:'极端收益',short:'极端收益',sub:'extreme · 既有历史选择方式',type:'history',description:'提供收益最低和最高的各两条已完成修改记录，作为条件检索的直接比较方法。',role:'与极端收益历史比较'},
 {id:'context',name:'条件检索',short:'条件检索',sub:'context · 本轮研究方法',type:'history',description:'按当前父代诊断和行为相似性，检索相关的支持记录与非正收益记录。是否有效须通过正式配对评价。',role:'检验历史与当前条件的关联'},
 {id:'permuted',name:'置换结果',short:'置换结果',sub:'permuted · 历史关联消融',type:'history',description:'在本链已完成记录间置换整个改动后结果块，再进行检索。当前父代诊断和固定筛选不置换；检验的是历史条件与结果的关联。',role:'历史条件—结果关联消融'},
 {id:'random',name:'随机程序搜索',short:'随机程序搜索',sub:'random · 搜索过程对照',type:'history',description:'使用预先登记的有界随机程序生成器，共享程序工具和搜索机会，不调用LLM。不是对所有可能程序的均匀采样。',role:'相同机会与标签预算的搜索对照'},
 {id:'fixed',name:'固定对照 · 43项配置',short:'固定对照',sub:'40个数值配置 + 3个领域适配',type:'fixed',description:'全部43项在10个共同开发初始化上比较，按平均nAUBC和登记并列规则选择强固定方法。正式评价报告全部43项，不按最终成绩选对照。',role:'强固定基线与领域方法'}
];
let last=null,selected='overview',loading=false,currentValid=false;
function set(id,value){$(id).textContent=value;}
function pill(id,label,kind='pending'){set(id,label);$(id).className='pill '+kind;}
function taskState(task,p){
 const v=stageView(p);
 if(task.type==='fixed'){const row=v.rows.find(x=>x.id==='fixed_development');return{label:row.label,kind:row.kind};}
 if(task.type==='history'){
  if(v.current<3)return{label:'未开始',kind:'pending'};
  if(v.current===3)return{label:'分组进度待确认',kind:'pending'};
  return{label:'搜索已结束 · 待正式结果',kind:'pending'};
 }
 return executionView(p);
}
function choose(id){
 const task=tasks.find(x=>x.id===id)||tasks[0];selected=task.id;
 set('selected-title',task.name);set('selected-description',task.description);
 set('selected-reference',task.type==='overview'?'共同协议：32个初始化 + 8轮 × 16次查询 = 每回放160个标签；各处理共享工具和筛选规则。':
 task.type==='fixed'?'开发：每配置10个共同初始化；正式评价：每方法50个新初始化。下方显示共同执行阶段。':
 '本组设计：5条独立链，每链20次提案机会，最终50个共同初始化。下方显示共同执行阶段，不推算分组成绩。');
 document.querySelectorAll('[data-task]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.task===selected)));
 $('mobile-task').value=selected;
 if(last){const s=currentValid?taskState(task,last):{label:'状态待核对',kind:'pending'};pill('selected-status',s.label,s.kind);}
}
function sidebar(){
 for(const task of tasks){
  const button=document.createElement('button');button.type='button';button.dataset.task=task.id;button.setAttribute('aria-pressed',String(task.id===selected));
  const strong=document.createElement('strong');strong.textContent=task.short;const small=document.createElement('small');small.textContent=task.sub;
  button.append(strong,small);button.addEventListener('click',()=>choose(task.id));$('task-list').append(button);
  const option=document.createElement('option');option.value=task.id;option.textContent=task.short;$('mobile-task').append(option);
 }
 $('mobile-task').addEventListener('change',e=>choose(e.target.value));
 $('task-search').addEventListener('input',e=>{
  const query=e.target.value.trim().toLowerCase();let visible=0;
  $('task-list').querySelectorAll('button').forEach(b=>{const task=tasks.find(t=>t.id===b.dataset.task);b.hidden=!(task.name+' '+task.id+' '+task.sub).toLowerCase().includes(query);if(!b.hidden)visible++;});
  $('empty-search').hidden=visible>0;
 });
}
function matrix(p){
 $('task-matrix').replaceChildren();
 const filter=$('task-filter').value;
 for(const task of tasks.filter(t=>t.type!=='overview'&&(filter==='all'||t.type===filter))){
  const tr=document.createElement('tr');const first=document.createElement('td');const button=document.createElement('button');
  button.type='button';button.className='text-button';button.textContent=task.name;button.addEventListener('click',()=>{choose(task.id);$('selected').scrollIntoView({behavior:'auto',block:'start'});});
  const small=document.createElement('small');small.className='cell-label';small.textContent=task.id;first.append(button,small);tr.append(first);
  const s=currentValid?taskState(task,p):{label:'待核对',kind:'pending'};
  for(const value of [task.role,task.type==='fixed'?'43配置 × 10初始化':'5链 × 20机会',s.label,task.type==='fixed'?'每方法50初始化':'5链 × 50初始化']){
   const td=document.createElement('td');td.textContent=value;tr.append(td);
  }
  $('task-matrix').append(tr);
 }
}
function draw(p,origin){
 last=p;currentValid=true;const c=p.counts,view=executionView(p),stages=stageView(p),confirmation=confirmationView(p);
 set('program-episodes',number(c.episodes_completed));set('program-labels',number(c.known_label_queries));
 set('episodes-sub','失败 '+number(c.episodes_failed)+'；未结束 '+number(c.unresolved_episodes)+' · 全版本回放上限11,590');
 set('fixed-progress',number(stages.fixed)+' / 430');set('confirmation-progress',confirmation.label);set('confirmation-detail',confirmation.detail);
 set('program-state',view.label+' · '+(stageNames[p.stage]||'尚未进入执行阶段'));
 $('freshness').className='freshness '+view.kind;
 set('program-time','回放记录：'+time(p.source_updated_utc)+' · 进程核验：'+time(p.execution.checked_utc)+'（北京时间）');
 set('freshness-detail',origin+'。'+view.detail+'网页每分钟检查更新；同步延迟以这两个时间为准。');
 set('engineering-progress',number(stages.engineering)+' / 10');set('fixed-card-progress',number(stages.fixed)+' / 430');
 $('engineering-bar').style.width=String(stages.engineering/10*100)+'%';$('fixed-bar').style.width=String(stages.fixed/430*100)+'%';
 for(const [id,phase]of [['engineering-state','engineering'],['fixed-state','fixed_development'],['search-state','search'],['confirmation-state','confirmation']]){
  const row=stages.rows.find(x=>x.id===phase);pill(id,row.label,row.kind);
 }
 $('stage-list').replaceChildren();
 const notes={engineering:'5起点 × 两种实现；检查选点、曲线和记账一致性',fixed_development:'43项 × 10初始化；0模型API',provider_engineering:'真实模型身份与人工代码执行；每类工程检查最多6次',search:'五组各五链；每链20机会；科学提案不重试',freeze:'所有部署程序、方法、种子和评价规则冻结',confirmation:'68方法 × 50新初始化；最终反馈不回流',analysis:'主要比较、置信区间、成本与完整失败记录'};
 stages.rows.forEach((row,i)=>{
  const li=document.createElement('li'),n=document.createElement('span'),div=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small'),state=document.createElement('span');
  n.className='step-number';n.textContent=String(i+1);strong.textContent=stageNames[row.id];small.textContent=notes[row.id];state.textContent=row.label;state.className='pill '+row.kind;div.append(strong,small);li.append(n,div,state);$('stage-list').append(li);
 });
 const note=document.createElement('strong'),body=document.createElement('p');
 if(p.status==='paused'){
  note.textContent='研究已暂停 · 科研结果尚未形成';
  body.textContent='暂停发生在'+(stageNames[p.stage]||'执行阶段')+'。已完成回放与失败单元保留；详细故障记录见页末。不能把已有执行数量解释为方法优势。';
 }else{note.textContent='尚未证明优势';body.textContent='工程验证、回放完成和方法有效性分别记录；完整正式配对结果及独立复核之前，不宣称历史机制或RSI优势。';}
 $('research-note').replaceChildren(note,body);
 pill('results-status',p.stage==='completed'||stages.current>5?'运行完成 · 指标待复核':'尚无完整正式结果','pending');
 set('program-requests',number(c.model_requests_started));set('program-failures',number(c.model_requests_failed));set('request-unsettled',number(c.model_requests_unsettled));
 set('known-tokens',number(c.known_tokens));set('unknown-usage',number(c.unknown_token_records));const prior=p.prior_runs.reduce((a,r)=>({started:a.started+r.requests_started,completed:a.completed+r.requests_completed,failed:a.failed+r.requests_failed,tokens:a.tokens+r.known_tokens,unknown:a.unknown+r.unknown_token_records}),{started:0,completed:0,failed:0,tokens:0,unknown:0});
 set('prior-requests',number(prior.started));
 set('program-detail','本版本已知查询只包含已结算的回放；未结束回放不推算。前序工程调用 '+prior.started+'次（完成'+prior.completed+'、失败'+prior.failed+'），已知token '+prior.tokens+'、用量未知 '+prior.unknown+'条。未知用量不当作零，金额费用未知。');
 matrix(p);choose(selected);$('load-error').hidden=true;
}
async function update(){
 if(loading)return;loading=true;$('refresh').disabled=true;
 try{
  const paths=location.hostname.endsWith('github.io')?['data/program-history.json']:['/api/program-progress','data/program-history.json'];
  let accepted=false;
  for(const path of paths){
   try{const r=await fetch(path,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)continue;const p=await r.json();if(!validateProgram(p))continue;
    draw(p,r.headers.get('x-snapshot-source')==='live-store'?'在线公开记录':path.startsWith('data/')?'已发布公开快照':'打包公开快照');accepted=true;break;
   }catch{}
  }
  if(!accepted){currentValid=false;set('program-state','公开记录暂不可用');$('freshness').className='freshness unknown';set('freshness-detail','不能确认当前状态；已显示的计数保留为最后一次有效记录。');
   set('selected-status','状态待核对');$('selected-status').className='pill pending';
   for(const id of ['engineering-state','fixed-state','search-state','confirmation-state'])pill(id,'待核对');
   $('stage-list').textContent='公开记录读取失败，阶段状态待核对。';
   $('task-matrix').querySelectorAll('tr').forEach(row=>{if(row.children[3])row.children[3].textContent='待核对';});
   set('load-error','执行记录读取失败。未加载或保留的数值不能作为当前运行或科研效果的证据。');$('load-error').hidden=false;
  }
 }finally{loading=false;$('refresh').disabled=false;}
}
sidebar();choose('overview');$('refresh').addEventListener('click',update);$('task-filter').addEventListener('change',()=>{if(last)matrix(last);});
await update();setInterval(update,60000);
