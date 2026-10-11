import {writeFile,rename} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validateProgress} from '../public/model.js';

export const SOURCE='https://protein-rsi-study-20261002.colttait034.chatgpt.site/api/report';
const destination=fileURLToPath(new URL('../public/data/progress.json',import.meta.url));

export function publicSnapshot(value){
  if(!validateProgress(value))throw Error('Invalid public execution snapshot');
  const counts={};
  for(const key of ['episodes_started','episodes_completed','episodes_failed',
    'known_label_queries','recorded_model_requests','model_responses_completed',
    'model_attempts_failed','model_attempts_unsettled'])counts[key]=value.counts[key];
  return{schema_version:1,generated_utc:value.generated_utc,
    study_version:value.study_version,source_updated_utc:value.source_updated_utc,
    counts,execution:{active:value.execution.active,checked_utc:value.execution.checked_utc,
      note:value.execution.note},scientific_support:false,
    log:value.log.map(row=>({date:row.date,text:row.text}))};
}

export async function updateProgress(fetcher=fetch,file=destination){
  const response=await fetcher(SOURCE,{signal:AbortSignal.timeout(30000),
    headers:{Accept:'application/json'},redirect:'error'});
  if(!response.ok)throw Error('Public snapshot HTTP '+response.status);
  if(response.headers.get('x-snapshot-source')==='packaged'){
    throw Error('Public source is serving a packaged fallback; retaining the existing snapshot');
  }
  const body=await response.text();
  if(Buffer.byteLength(body)>1024*1024)throw Error('Public snapshot exceeds size limit');
  const snapshot=publicSnapshot(JSON.parse(body));
  const temporary=file+'.tmp';
  await writeFile(temporary,JSON.stringify(snapshot,null,2)+'\n');
  await rename(temporary,file);
  return snapshot;
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const snapshot=await updateProgress();
  console.log(JSON.stringify({source_updated_utc:snapshot.source_updated_utc,
    generated_utc:snapshot.generated_utc,study_version:snapshot.study_version,
    episodes_completed:snapshot.counts.episodes_completed,
    scientific_support:snapshot.scientific_support}));
}
