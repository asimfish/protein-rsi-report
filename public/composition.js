const $=id=>document.getElementById(id);
const num=x=>Number.isFinite(x)?x.toFixed(4):'—';
const interval=x=>`${num(x.mean_delta)} [${num(x.ci95[0])}, ${num(x.ci95[1])}]`;
const names={model_mixed:'更换为mixed epistasis',acquisition_ei:'改用EI',pool_local:'局部候选池',blend_pairwise:'加入排名融合',switch_mixed_ei:'加入停滞条件分支'};
function row(target,values){const tr=document.createElement('tr');for(const v of values){const td=document.createElement('td');td.textContent=String(v);tr.append(td);}target.append(tr);}
function draw(stage){
 $('methods').replaceChildren();$('edits').replaceChildren();
 for(const m of stage.methods){const p=m.specification;row($('methods'),[`P${m.policy_id}`,`${p.model} / ${p.acquisition} / ${p.pool}${p.blend_model?' / rank blend':''}${p.switch?' / conditional switch':''}`,m.n,num(m.mean_nAUBC),num(m.mean_normalized_best)]);}
 for(const e of stage.edits)row($('edits'),[`P${e.parent_id} → P${e.child_id}`,names[e.edit_id],interval(e.nAUBC),interval(e.terminal),e.first_batch_mean_changed.toFixed(2),num(e.first_batch_mean_jaccard)]);
 $('shadow').textContent=stage.shadow_behavior.map(s=>`P${s.policy_id}：${s.changed_rounds}/${s.rounds}轮同状态影子比较改变候选集合；平均变更${s.mean_changed_candidates.toFixed(2)}/16，Jaccard ${num(s.mean_jaccard)}；额外标签0。`).join(' ');
}
try{
 const r=await fetch('data/composition-study.json',{cache:'no-store'});if(!r.ok)throw Error('snapshot unavailable');
 const d=await r.json();if(d.version!=='composable-edit-mechanism-7'||d.scientific_support!==false)throw Error('wrong scope');
 const p=d.progress;$('status').textContent=`${p.status} · ${p.stage} · 已完成 ${p.completed_replays} / ${p.max_replays} 回放；已结算标签 ${p.paid_label_queries.toLocaleString()}；失败 ${p.failed_replays}；收费未结算记录 ${p.unsettled_cost_records}；模型请求 ${p.provider_requests}。服务检查：${d.execution_active?'运行中':'未运行'}。`;
 $('timestamp').textContent=`已发布快照 ${d.generated_utc}；研究更新 ${new Date(p.updated*1000).toISOString()}。不是未经结算的实时计数。`;
 for(const s of d.stages){const o=document.createElement('option');o.value=s.stage;o.textContent=`${s.stage}（${s.initialization_count} 初始化）`;$('stage').append(o);}
 if(d.stages.length){$('stage').value=d.stages.at(-1).stage;draw(d.stages.at(-1));$('stage').addEventListener('change',()=>draw(d.stages.find(s=>s.stage===$('stage').value)));}
 if(d.utility){const u=d.utility,n=u.checks.filter(c=>c.interval_contains_validation_mean).length;$('utility').textContent=`完整独立验证已结束；9项编辑中${n}项验证均值位于训练预测的95%区间内。这是单次验证的经验检查，不等于已建立区间校准。`;
  for(const [k,v] of Object.entries(u.comparisons))row($('utility-table'),[k==='mean_selected_policy'?'预测均值最大':'区间下界 > 0.01（否则保留父代）',`P${v.selected_policy}`,interval(v.versus_parent),interval(v.versus_uniform_expected),interval(v.versus_strong_fixed),interval(v.terminal_versus_strong_fixed)]);
 }
}catch{$('status').textContent='公开快照暂不可用，不能确认当前进度。';}
