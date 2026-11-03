import test from 'node:test';
import assert from 'node:assert/strict';
import {createCoachServer} from '../server-http.mjs';
test('HTTP server protects configuration and handles local AI requests',async()=>{
 let invoked=0;
 const server=createCoachServer({apiKey:'synthetic-private',coach:async payload=>{invoked++;return {text:payload.message};}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const status=await(await fetch(base+'/api/status')).json();assert.equal(status.configured,true);assert.equal(JSON.stringify(status).includes('synthetic-private'),false);
  for(const route of ['/.env','/server-env.mjs','/openai-agent.mjs'])assert.equal((await fetch(base+route)).status,404);
  assert.equal((await fetch(base+'/api/chat',{method:'POST',headers:{Origin:'https://untrusted.example','Content-Type':'application/json'},body:'{}'})).status,403);
  assert.equal(invoked,0);
  const response=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Hello'})});assert.equal(response.status,200);assert.equal((await response.json()).text,'Hello');
  const bad=await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:'invalid'});assert.equal(bad.status,400);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('hosted backend permits the configured Pages origin and applies a shared daily request limit',async()=>{
 let invoked=0;const origin='https://anshulshahmis.github.io';
 const server=createCoachServer({apiKey:'synthetic-private',publicOrigin:'https://coach.example',allowedOrigins:[origin],dailyLimit:2,coach:async()=>{invoked++;return {text:'Example'};}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const preflight=await fetch(base+'/api/chat',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST'}});assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),origin);
  const denied=await fetch(base+'/api/status',{headers:{Origin:'https://untrusted.example'}});assert.equal(denied.status,403);assert.equal(invoked,0);
  for(let i=0;i<3;i++){
   const response=await fetch(base+'/api/chat',{method:'POST',headers:{Origin:origin,Authorization:'Bearer sk-'+ 'v'.repeat(32),'Content-Type':'application/json'},body:'{"message":"Hello"}'});assert.equal(response.status,i<2?200:429);
  }
  assert.equal(invoked,2);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
