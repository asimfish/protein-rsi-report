import {validateProgram} from './program-model.js';
const stage={engineering:'工程一致性检查',fixed_development:'固定对照开发',search:'五组策略搜索',freeze:'全局冻结',confirmation:'GB1确认性评价',analysis:'统计分析',provider_engineering:'真实API与代码执行检查',completed:'全部运行阶段完成'};
const status={registered:'已登记',running:'执行中',paused:'已暂停',completed:'运行完成'};
const text=(id,x)=>{document.getElementById(id).textContent=x;};
async function update(){
 let p,origin='';
 const paths=location.hostname.endsWith('github.io')?['data/program-history.json']:['/api/program-progress','data/program-history.json'];
 for(const path of paths){try{const r=await fetch(path,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)continue;const value=await r.json();if(!validateProgram(value))continue;p=value;origin=r.headers.get('x-snapshot-source')==='live-store'?'在线存储':path==='data/program-history.json'?'公开快照':'打包快照';break;}catch{}}
 if(!p){text('program-state','快照暂不可用');text('program-detail','未取得有效快照，不能推断运行状态或完成数量。');return;}
 const age=(Date.now()-Date.parse(p.source_updated_utc))/60000;
 const fresh=age<=10&&(Date.now()-Date.parse(p.execution.checked_utc))/60000<=10;
 text('program-state',(fresh?status[p.status]:'执行状态待核对（上次：'+status[p.status]+'）')+' · '+(stage[p.stage]||'等待执行')+' · '+(fresh?(p.execution.active?'进程活跃':'进程未活跃'):'进程状态已过期'));
 text('program-time',p.source_updated_utc.replace('T',' ').replace('+00:00',' UTC'));
 for(const [id,key]of [['program-episodes','episodes_completed'],['program-labels','known_label_queries'],['program-requests','model_requests_started'],['program-failures','model_requests_failed']])text(id,p.counts[key].toLocaleString('zh-CN'));
 text('program-detail',origin+'；'+(age>10?'源计数已超过10分钟未更新，不能据此认定仍在运行。':'源计数在10分钟内更新。')+'本版本未结束回放 '+p.counts.unresolved_episodes+'，未结算调用 '+p.counts.model_requests_unsettled+'，已知 token '+p.counts.known_tokens+'；未知用量记录 '+p.counts.unknown_token_records+'。已知 token 不含未知记录，金额费用未知。');
}
await update();setInterval(update,60000);
