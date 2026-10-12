const object=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const counts=['episodes_started','episodes_completed','episodes_failed','unresolved_episodes','known_label_queries','model_requests_started','model_requests_completed','model_requests_failed','model_requests_unsettled','known_tokens','unknown_token_records'];
const timestamp=x=>typeof x==='string'&&/Z$|[+-]\d\d:\d\d$/.test(x)&&Number.isFinite(Date.parse(x));
export function validateProgram(p){
 if(!object(p,['schema_version','study_version','source_updated_utc','generated_utc','status','stage','counts','budget','execution','prior_runs','scientific_support','meta_improver_supported']))return false;
 if(p.schema_version!==1||p.study_version!=='program-history-3'||p.scientific_support!==false||p.meta_improver_supported!==false||!timestamp(p.source_updated_utc)||!timestamp(p.generated_utc))return false;
 if(!['registered','running','paused','completed'].includes(p.status)||![null,'engineering','fixed_development','search','freeze','confirmation','analysis','provider_engineering','completed'].includes(p.stage))return false;
 if(!object(p.counts,counts)||!counts.every(k=>Number.isSafeInteger(p.counts[k])&&p.counts[k]>=0))return false;
 const c=p.counts;if(c.episodes_completed+c.episodes_failed+c.unresolved_episodes!==c.episodes_started||c.model_requests_completed+c.model_requests_failed+c.model_requests_unsettled!==c.model_requests_started)return false;
 if(!object(p.budget,['episodes','labels','requests','proposals'])||p.budget.episodes!==11590||p.budget.labels!==1854400||p.budget.requests!==412||p.budget.proposals!==500)return false;
 if(c.episodes_started>p.budget.episodes||c.known_label_queries>p.budget.labels||c.model_requests_started>p.budget.requests)return false;
 if(!object(p.execution,['active','checked_utc'])||typeof p.execution.active!=='boolean'||!timestamp(p.execution.checked_utc))return false;
 const expected=[['program-history-1',2,1,1,42,1,0],['program-history-2',1,0,1,0,1,0],['provider-diagnostic',1,0,1,0,1,0]];
 const fields=['study_version','requests_started','requests_completed','requests_failed','known_tokens','unknown_token_records','label_queries'];
 return Array.isArray(p.prior_runs)&&p.prior_runs.length===3&&p.prior_runs.every((r,i)=>object(r,fields)&&fields.every((k,j)=>r[k]===expected[i][j]));
}
