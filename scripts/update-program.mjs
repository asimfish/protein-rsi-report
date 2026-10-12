import {writeFile,rename} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {validateProgram} from '../public/program-model.js';
export const SOURCE='https://protein-rsi-study-20261002.colttait034.chatgpt.site/api/program-progress';
const destination=fileURLToPath(new URL('../public/data/program-history.json',import.meta.url));
export async function updateProgram(fetcher=fetch,file=destination){
 const r=await fetcher(SOURCE,{signal:AbortSignal.timeout(30000),headers:{Accept:'application/json'},redirect:'error'});
 if(!r.ok||r.headers.get('x-snapshot-source')!=='live-store')throw Error('No live program progress snapshot');
 const body=await r.text();if(Buffer.byteLength(body)>1024*1024)throw Error('Oversized progress');
 const p=JSON.parse(body);if(!validateProgram(p))throw Error('Invalid progress');
 await writeFile(file+'.tmp',JSON.stringify(p,null,2)+'\n');await rename(file+'.tmp',file);return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const p=await updateProgram();console.log(JSON.stringify({source_updated_utc:p.source_updated_utc,episodes_completed:p.counts.episodes_completed,scientific_support:false}));}
