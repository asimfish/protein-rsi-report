const stages=['engineering','fixed_development','provider_engineering','search','freeze','confirmation','analysis'];
export const stageNames={engineering:'数值一致性验证',fixed_development:'固定对照开发',provider_engineering:'模型接口与代码执行验证',search:'五组策略搜索',freeze:'全部策略冻结',confirmation:'GB1正式评价',analysis:'统计分析',completed:'全部运行阶段完成'};
const minutes=(now,t)=>(now-Date.parse(t))/60000;
export function executionView(p,now=Date.now()){
 const recentCheck=minutes(now,p.execution.checked_utc)<=10;
 const recentData=minutes(now,p.source_updated_utc)<=10;
 if(p.status==='paused')return recentCheck&&!p.execution.active?
  {label:'已暂停',kind:'paused',detail:'本地进程已停止；保留暂停前的已完成回放与失败记录。'}:
  {label:'记录已暂停 · 当前状态待核对',kind:'unknown',detail:'暂停状态来自最近的研究记录，当前进程状态需要重新核验。'};
 if(p.status==='completed')return{label:'运行阶段完成 · 科研结论待复核',kind:'complete',detail:'回放完成不代表主要对比通过，也不代表RSI优势得到证明。'};
 if(p.status==='registered')return{label:'已登记 · 尚未开始',kind:'pending',detail:'当前记录未进入实际回放；计数来自登记后的公开记录。'};
 if(!recentCheck)return{label:'运行状态待核对',kind:'unknown',detail:'进程检查已超过10分钟，不能确认当前仍在执行。'};
 if(!p.execution.active)return{label:'进程未运行',kind:'paused',detail:'本地检查未发现活跃进程；研究记录尚未更新为暂停。'};
 if(!recentData)return{label:'进程活跃 · 回放进度待核对',kind:'unknown',detail:'本地进程仍活跃，但回放计数已超过10分钟未更新。'};
 return{label:'执行中',kind:'running',detail:'本地进程与回放计数均在10分钟内核验。'};
}
export function stageView(p,now=Date.now()){
 const current=p.stage==='completed'?stages.length:stages.indexOf(p.stage),c=p.counts;
 const uncertain=p.status==='running'&&executionView(p,now).kind!=='running';
 return{engineering:Math.min(10,c.episodes_completed),fixed:current<1?0:Math.min(430,Math.max(0,c.episodes_completed-10)),current,
 rows:stages.map((id,i)=>({id,label:i<current?'已完成':i===current?(p.status==='paused'?'已暂停':p.status==='running'?(uncertain?'待核对':'进行中'):'待开始'):'未开始',
 kind:i<current?'complete':i===current?(p.status==='paused'?'paused':p.status==='running'&&!uncertain?'running':'pending'):'pending'}))};
}
export function confirmationView(p){
 const index=stages.indexOf(p.stage);
 if(p.stage==='completed'||index>5)return{label:'回放已完成',detail:'3,400个正式配对单元；指标需独立复核。'};
 if(index===5)return{label:'进行中',detail:'当前快照仅提供总计数，不推算正式评价完成数。'};
 return{label:'未开始',detail:'全部策略冻结后，68个方法 × 50个初始化。'};
}
