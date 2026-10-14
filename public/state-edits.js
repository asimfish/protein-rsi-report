const $=id=>document.getElementById(id);
const number=x=>Number.isFinite(x)?x.toFixed(5):'—';
const interval=x=>`${number(x.mean_delta)} [${number(x.ci95[0])}, ${number(x.ci95[1])}]`;
const names={parent:'保留 P0',uniform_expected:'均匀选择期望（含不修改）',group:'分组配对均值',pooled:'整回放平均诊断',state:'决策前状态'};
const variants={stagnation_global:'停滞 / 全局',stagnation_local:'停滞 / 局部',diagnostics_global:'停滞＋预测失配 / 全局',diagnostics_local:'停滞＋预测失配 / 局部'};
function row(id,values){const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}$(id).append(tr);}
async function refresh(){try{
 const response=await fetch('data/state-edit-study.json',{cache:'no-store'});if(!response.ok)throw Error('Unavailable snapshot');
 const d=await response.json();if(d.version!=='state-conditional-edit-8'||d.scientific_support!==false)throw Error('Wrong study scope');
 const p=d.progress;const stages={sanity:'工程 sanity',training:'训练',diagnosis:'冻结后机制诊断',analysis:'完整分析',not_started:'尚未启动'};
 const states={running:'运行中',completed:'已完成',failed:'失败，保留原记录',paused:'已暂停',implementation_review:'实现评审中'};
 $('status').textContent=`${states[p.status]??p.status} · ${stages[p.stage]??p.stage} · 服务${d.execution_active?'运行中':'未运行'} · 收费未结算记录 ${p.unsettled_cost_records}`;
 $('completed').textContent=p.completed_replays;$('queries').textContent=p.paid_label_queries.toLocaleString();$('failures').textContent=p.failed_replays;$('requests').textContent=p.provider_requests;
 $('time').textContent=`公开快照 ${d.generated_utc}；研究更新 ${p.updated?new Date(p.updated*1000).toISOString():'尚无研究记录'}。仅包含已结算计数。`;
 for(const id of ['methods','comparisons','estimators','effects'])$(id).replaceChildren();
 if(d.result){const r=d.result;$('result-note').textContent='20 个冻结后新初始化的机制诊断已全部完成；下表为事前记录选择的实测回放收益，没有部署接受或 RSI 优效声明。';
  for(const m of r.methods)row('methods',[names[m.method],m.n_initializations,number(m.mean_nAUBC),number(m.mean_normalized_best),`${m.no_edit_decisions}${m.no_edit_count_type==='expectation'?'（期望）':''}`]);
  for(const c of r.comparisons)row('comparisons',[names[c.reference],interval(c.nAUBC),interval(c.terminal)]);
  for(const e of r.estimators)row('estimators',[names[e.estimator],e.feature_count,`${e.supported}/${e.total}`,number(e.rmse),number(r.common_supported_rmse[e.estimator]),number(e.positive_sign_accuracy)]);
  for(const e of d.effects)row('effects',[e.start_round,variants[e.variant],interval(e.nAUBC),interval(e.terminal),`${e.changed_replays}/20`,e.triggered_rounds]);
  $('downloads').replaceChildren();for(const [name,label] of [['RESULTS.md','完整结果'],['selection-methods.csv','选择器 CSV'],['estimator-diagnostics.csv','估计器 CSV'],['edit-effects.csv','编辑收益 CSV']]){const a=document.createElement('a');a.href=`downloads/state-a-${name}`;a.textContent=label;a.download='';$('downloads').append(a,document.createTextNode(' · '));}
 }
 }catch{$('status').textContent='快照暂不可用，当前进度无法确认。';}}
await refresh();setInterval(refresh,60000);
