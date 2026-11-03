import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {CoachError,runOpenAICoach,defaultModel} from './openai-agent.mjs';
import {runOpenAIMultiAgent} from './openai-multi-agent.mjs';
import {visitorKeyFromHeader} from './visitor-key.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.md':'text/markdown; charset=utf-8'};
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
async function readJson(req){
 if(!req.headers['content-type']?.startsWith('application/json'))throw new CoachError('Send JSON content.',415);
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>300000)throw new CoachError('This request is too large. Shorten the conversation or documents.',413);chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new CoachError('Invalid JSON request.',400);}
}
export function createCoachServer({architecture=process.env.CAREER_COMPASS_AGENT_MODE||'multi-agent',coach=architecture==='single-agent'?runOpenAICoach:runOpenAIMultiAgent,apiKey=process.env.OPENAI_API_KEY,model=process.env.OPENAI_MODEL||defaultModel,publicOrigin=process.env.RENDER_EXTERNAL_URL||process.env.BACKEND_PUBLIC_URL||'',allowedOrigins=(process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean),dailyLimit=60}={}){
 if(!['single-agent','multi-agent'].includes(architecture))throw Error('Invalid agent architecture.');
 const publicUrl=publicOrigin?new URL(publicOrigin):null;
 const requiresApiKey=Boolean(publicUrl)||Boolean(process.env.PORT)||!apiKey;
 const allowed=new Set(allowedOrigins.map(value=>new URL(value.trim()).origin));
 let inFlight=0;let requests=[];let day='';let dailyRequests=0;
 return http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');
  const host=req.headers.host||'';
  if(!/^(127\.0\.0\.1|localhost):\d+$/.test(host)&&host!==publicUrl?.host)return json(res,403,{error:'Invalid host.'});
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return json(res,400,{error:'Invalid path.'});}
  if(pathname.startsWith('/api/')){
   const origin=req.headers.origin;
   if(origin){
    const local=/^(127\.0\.0\.1|localhost):\d+$/.test(host);
    if(!allowed.has(origin)&&origin!==publicUrl?.origin&&!(local&&origin===`http://${host}`))return json(res,403,{error:'This website is not authorized to use the AI server.'});
    res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');
    res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');
   }
   if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  }
  if(pathname==='/api/status'&&req.method==='GET')return json(res,200,{configured:!requiresApiKey,allowsVisitorKey:true,requiresApiKey,authMode:requiresApiKey?'visitor-key':'local-server-key',model,version:'0.8.0',architecture});
  if(pathname==='/api/chat'){
   if(req.method!=='POST')return json(res,405,{error:'Use POST.'});
   let requestKey;
   try{requestKey=visitorKeyFromHeader(req.headers.authorization);}
   catch(error){return json(res,error.status,{error:error.message});}
   if(!requestKey&&requiresApiKey)return json(res,401,{error:'Enter your own OpenAI API key in AI settings to use AI. Practice mode is available without a key.'});
   requestKey=requestKey||apiKey;
   requests=requests.filter(t=>Date.now()-t<60000);
   const today=new Date().toISOString().slice(0,10);if(today!==day){day=today;dailyRequests=0;}
   if(dailyRequests>=dailyLimit)return json(res,429,{error:'The shared daily demo limit has been reached. Please try again tomorrow.'});
   if(inFlight>=2||requests.length>=20)return json(res,429,{error:'The local coach is busy. Please wait a minute and retry.'});
   requests.push(Date.now());dailyRequests++;inFlight++;
   const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),120000);
   const close=()=>{if(!res.writableEnded)controller.abort();};res.on('close',close);
   try {const payload=await readJson(req);const answer=await coach(payload,{apiKey:requestKey,model,signal:controller.signal});if(!res.destroyed)json(res,200,answer);}
   catch(error){if(!res.destroyed)json(res,error instanceof CoachError?error.status:502,{error:error instanceof CoachError?error.message:'The AI request failed. Please retry.'});}
   finally{requestKey=null;clearTimeout(timeout);res.off('close',close);inFlight--;}
   return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end('Method not allowed');}
  try {
   // Only serve dist. Dotfiles are never public, even if copied there accidentally.
   if(pathname.split('/').some(part=>part.startsWith('.')))return json(res,404,{error:'Not found.'});
   const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
   if(!file.startsWith(root+path.sep))return json(res,403,{error:'Forbidden.'});
   const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404);res.end('Not found');}
 });
}
