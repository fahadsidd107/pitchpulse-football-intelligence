import { createServer } from 'node:net'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomBytes } from 'node:crypto'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const root=dirname(fileURLToPath(import.meta.url))
process.chdir(root)
process.env.PATH=[join(homedir(),'.cargo/bin'),process.env.PATH].join(':')
const children=new Set()
let stopping=false
function stop(code=0){if(stopping)return;stopping=true;process.exitCode=code;for(const child of children)child.kill('SIGTERM');setTimeout(()=>{for(const child of children)child.kill('SIGKILL');process.exit(code)},3000).unref()}
process.on('SIGINT',()=>stop());process.on('SIGTERM',()=>stop())
function run(command,args,background=false){return new Promise((resolve,reject)=>{
 const child=spawn(command,args,{cwd:root,env:process.env,stdio:'inherit'});children.add(child)
 child.on('error',reject)
 child.on('exit',code=>{children.delete(child);if(background){if(!stopping){console.error(command+' stopped.');stop(code||1)}}else code===0?resolve():reject(new Error(command+' failed ('+code+')'))})
 if(background)resolve()
})}
async function ready(url,seconds){for(let i=0;i<seconds*2;i++){try{const response=await fetch(url,{signal:AbortSignal.timeout(800)});if(response.ok)return}catch{}await new Promise(r=>setTimeout(r,500))}throw new Error('Timed out waiting for '+url)}
try{
 const pin=readFileSync('.nvmrc','utf8').trim()
 if(process.versions.node.split('.')[0]!==pin)throw new Error('Node 24 is required. Run: nvm install 24 && nvm use 24, then npm run dev.')
 if(!existsSync('.env'))writeFileSync('.env',readFileSync('.env.example','utf8').replaceAll('CHANGE_ME',randomBytes(24).toString('hex')),{mode:0o600})
 // Parse dotenv as data; never execute shell code from configuration.
 for(const line of readFileSync('.env','utf8').split(/\r?\n/)){const m=line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&process.env[m[1]]===undefined){let v=m[2];if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'")))v=v.slice(1,-1);process.env[m[1]]=v}}
 if(spawnSync('docker',['info'],{stdio:'ignore'}).status!==0){
  if(process.platform!=='darwin')throw new Error('Start Docker Engine, then rerun npm run dev.')
  await run('open',['-a','Docker'])
  let ok=false;for(let i=0;i<60;i++){if(spawnSync('docker',['info'],{stdio:'ignore',timeout:2000}).status===0){ok=true;break}await new Promise(r=>setTimeout(r,1000))}
  if(!ok)throw new Error('Docker Desktop did not become ready.')
 }
 // Select a free API port rather than letting an older API serve stale routes.
 const host=process.env.API_HOST||'127.0.0.1'
 const preferred=Number(process.env.API_PORT||3000)
 async function available(port){return new Promise(resolve=>{const server=createServer();server.once('error',()=>resolve(false));server.listen(port,host,()=>server.close(()=>resolve(true)))})}
 let port=preferred
 while(!(await available(port))){port++;if(port>preferred+20)throw new Error('No free local API port found.')}
 process.env.API_PORT=String(port)
 process.env.VITE_API_BASE_URL='http://'+host+':'+port+'/api/v1'
 console.log('Using API '+process.env.VITE_API_BASE_URL)
 const full=process.argv.includes('--full')
 const pipeline=process.env.DEV_PIPELINE!=='false'
 if(!full)await run('docker',['compose','stop',...(pipeline?['rabbitmq']:['kafka','rabbitmq'])])
 console.log(full?'Starting all infrastructure…':'Starting PostgreSQL and Redis (current app dependencies)…')
 await run('docker',['compose','up','-d','--wait','--wait-timeout','90',...(full?['postgres','redis','kafka','rabbitmq']:pipeline?['postgres','redis','kafka']:['postgres','redis'])])
 // Reconcile only this Compose-managed local database; preserve its volume.
 const configured = new URL(process.env.DATABASE_URL || 'postgresql://localhost/pitchpulse')
 if (!['localhost','127.0.0.1','[::1]'].includes(configured.hostname)) throw new Error('npm run dev expects a local Compose DATABASE_URL; remote credentials will not be changed.')
 const sql = "\\getenv desired POSTGRES_PASSWORD\nSELECT format('ALTER ROLE %I PASSWORD %L', current_user, :'desired') \\gexec\n"
 const sync = spawnSync('docker',['compose','exec','-T','postgres','sh','-c','exec psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'],{input:sql,encoding:'utf8',stdio:['pipe','pipe','pipe']})
 if(sync.status!==0)throw new Error('Could not reconcile local PostgreSQL credentials. Verify POSTGRES_USER and POSTGRES_DB match the existing volume. No data was deleted.')
 configured.username=process.env.POSTGRES_USER||'pitchpulse'
 configured.password=process.env.POSTGRES_PASSWORD||''
 configured.hostname='127.0.0.1'
 configured.port=process.env.POSTGRES_PORT||'5433'
 configured.pathname='/'+(process.env.POSTGRES_DB||'pitchpulse')
 process.env.DATABASE_URL=configured.toString()
 console.log('Local PostgreSQL credentials synchronized; existing data preserved.')
 if(!existsSync('node_modules')||!existsSync('apps/web/node_modules'))await run('pnpm',['install','--frozen-lockfile'])
 console.log('Building API and database tools (cached after first run)…')
 await run('cargo',['build','--locked','-p','pitchpulse-api','-p','pitchpulse-infrastructure','-p','pitchpulse-ingest-worker','-p','pitchpulse-event-consumer','--bins'])
 await run(join(root,'target/debug/database'),[])
 if((process.env.APP_DATA_MODE||'mock')==='mock'){
  await run('python3',[join(root,'pitchpulse-data/scripts/mock_server.py')],true)
  await ready('http://127.0.0.1:8089/health',20)
 }
 if(pipeline){
  await run('docker',['compose','exec','-T','kafka','/opt/kafka/bin/kafka-topics.sh','--bootstrap-server','localhost:19092','--create','--if-not-exists','--topic','pitchpulse.football.v1','--partitions','3','--replication-factor','1'])
  await run(join(root,'target/debug/pitchpulse-event-consumer'),[],true)
  await run(join(root,'target/debug/pitchpulse-ingest-worker'),[],true)
 }
 await run(join(root,'target/debug/pitchpulse-api'),[],true)
 await ready('http://'+(process.env.API_HOST||'127.0.0.1')+':'+(process.env.API_PORT||'3000')+'/health/ready',20)
 await run('pnpm',['--dir','apps/web','dev'],true)
 console.log('\nPitchPulse: http://localhost:5173\nCtrl-C stops API and Vue; database volumes and containers remain available.')
}catch(error){console.error('\nStartup failed: '+error.message);stop(1)}
