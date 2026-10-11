import {cp,mkdir,rm,readdir,readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateProgress,validateCompleted} from '../public/model.js';
const root=fileURLToPath(new URL('../',import.meta.url)),out=root+'dist';
for(const [name,test] of [['progress',validateProgress],['completed',validateCompleted]])if(!test(JSON.parse(await readFile(root+`public/data/${name}.json`,'utf8'))))throw Error('Invalid public '+name+' data');
async function check(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink())throw Error('No public symlinks');if(e.isDirectory())await check(dir+'/'+e.name);}}
await check(root+'public');await rm(out,{recursive:true,force:true});await mkdir(out);await cp(root+'public',out,{recursive:true});console.log('Built static report: dist/');
