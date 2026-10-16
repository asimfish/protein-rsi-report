const $=id=>document.getElementById(id);
const number=x=>Number.isFinite(x)?x.toFixed(5):'—';
const interval=x=>`${number(x.mean_delta)} [${number(x.ci95[0])}, ${number(x.ci95[1])}]`;
const names={parent:'保留 P0',uniform_expected:'均匀选择期望（含不修改）',group:'分组配对均值',supported_group:'相同支持范围的分组均值',additive:'加性收益估计',interaction:'交互收益估计'};
const action=v=>v.replace('epistasis_pairwise','pairwise epistasis').replace('epistasis_mixed','mixed epistasis').replace('elite_hamming_1','局部').replace('_global','_全局').replaceAll('_',' / ');
function row(id,values){const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}$(id).append(tr);}
async function refresh(){try{
 const r=await fetch('data/factorial-study.json',{cache:'no-store'});if(!r.ok)throw Error('unavailable');const d=await r.json();if(d.version!=='factorial-edit-9'||d.scientific_support!==false)throw Error('wrong scope');const p=d.progress;
 const stages={sanity:'工程 sanity',training:'训练',diagnosis:'冻结后诊断',analysis:'完整分析',not_started:'尚未启动'};const states={running:'运行中',completed:'已完成',failed:'失败，保留原记录',paused:'已暂停',implementation_review:'实现评审中'};
 $('status').textContent=`${states[p.status]??p.status} · ${stages[p.stage]??p.stage} · 服务${d.execution_active?'运行中':'未运行'} · 在途或收费未结算记录 ${p.unsettled_cost_records}`;
 $('completed').textContent=p.completed_replays;$('queries').textContent=p.paid_label_queries.toLocaleString();$('failures').textContent=p.failed_replays;$('requests').textContent=p.provider_requests;
 $('time').textContent=`公开快照 ${d.generated_utc}；研究更新 ${p.updated?new Date(p.updated*1000).toISOString():'尚无研究记录'}。只计已结算消费。`;
 for(const id of ['methods','comparisons','estimators','effects','factors'])$(id).replaceChildren();
 if(d.result){const x=d.result;$('result-note').textContent='20 个新初始化的机制诊断已全部完成，以下为事前所选实际回放的完整聚合。没有部署接受或 RSI 优效预设。';
  for(const m of x.methods)row('methods',[names[m.method],m.n_initializations,number(m.mean_nAUBC),number(m.mean_normalized_best),`${number(m.no_edit_decisions)}${m.no_edit_count_type==='expectation'?'（期望）':''}`]);
  for(const c of x.comparisons)row('comparisons',[names[c.reference],interval(c.nAUBC),interval(c.terminal)]);
  for(const e of x.estimators)row('estimators',[names[e.estimator],e.feature_count,`${e.supported}/${e.total}`,number(e.rmse),number(e.mae),number(x.common_supported_rmse[e.estimator]),number(x.common_supported_mae[e.estimator])]);
  for(const e of d.effects)row('effects',[e.start_round,action(e.variant),interval(e.nAUBC),interval(e.terminal),`${e.changed_replays}/20`]);
  for(const f of x.factor_contrasts)row('factors',[f.start_round,f.contrast,interval(f.nAUBC)]);
  const choices=Object.entries(x.choice_counts.interaction).map(([v,n])=>`${v==='no_edit'?'保留父代':action(v)} ${n} 次`);$('choices').textContent=`交互选择器实际选择：${choices.join('；')}。`;
  $('capacity').textContent=`这一诊断矩阵中事后最优选择相对 P0 的平均增益：${interval(x.average_observed_hindsight_capacity)}。这是事后诊断值，不是部署收益。`;
  $('downloads').replaceChildren();for(const [name,label] of [['RESULTS.md','完整结果'],['selection-methods.csv','选择器 CSV'],['estimator-diagnostics.csv','估计器 CSV'],['edit-effects.csv','编辑收益 CSV'],['factor-contrasts.csv','因素对照 CSV']]){const a=document.createElement('a');a.href=`downloads/factorial-${name}`;a.textContent=label;a.download='';$('downloads').append(a,document.createTextNode(' · '));}
 }
 }catch{$('status').textContent='公开快照暂不可用，当前进度无法确认。';}}
await refresh();setInterval(refresh,60000);
