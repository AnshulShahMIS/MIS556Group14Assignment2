import test from 'node:test';
import assert from 'node:assert/strict';
import {createTabKey,normalizeVisitorKey} from '../dist/tab-key.mjs';
import {visitorKeyFromHeader} from '../visitor-key.mjs';
import {createCoachServer} from '../server-http.mjs';
const first='sk-'+ 'a'.repeat(32),second='sk-'+ 'b'.repeat(32);
test('tab keys are isolated, transient and absent from serialized connection state',()=>{
 const a=createTabKey(),b=createTabKey();a.set(first);b.set(second);
 assert.equal(a.headers().Authorization,'Bearer '+first);assert.equal(b.headers().Authorization,'Bearer '+second);
 assert.equal(JSON.stringify(a).includes(first),false);a.clear();assert.deepEqual(a.headers(),{});assert.equal(b.has(),true);
 assert.equal(createTabKey().has(),false);
});
test('invalid keys and authorization headers return only safe errors',()=>{
 assert.equal(normalizeVisitorKey('  '+first+'  '),first);assert.equal(visitorKeyFromHeader(undefined),null);
 for(const input of ['Basic '+first,'Bearer invalid','Bearer '+first+'\r\nInjected: value'])assert.throws(()=>visitorKeyFromHeader(input),error=>error.status===401&&!error.message.includes(first));
});
test('public Node hosting requires each visitor key and never falls back to the owner key',async()=>{
 const received=[];const origin='https://anshulshahmis.github.io';
 const server=createCoachServer({apiKey:'owner-secret-not-for-visitors',publicOrigin:'https://coach.example',allowedOrigins:[origin],coach:async(payload,options)=>{received.push(options.apiKey);return {text:'Advice'};}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  const status=await (await fetch(base+'/api/status')).json();assert.equal(status.configured,false);assert.equal(status.requiresApiKey,true);
  const post=key=>fetch(base+'/api/chat',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(key?{Authorization:'Bearer '+key}:{})},body:'{"message":"Help me plan"}'});
  assert.equal((await post()).status,401);assert.equal(received.length,0);
  assert.equal((await post(first)).status,200);assert.equal((await post(second)).status,200);
  assert.equal((await post()).status,401);assert.deepEqual(received,[first,second]);
  const preflight=await fetch(base+'/api/chat',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Headers':'authorization,content-type'}});assert.match(preflight.headers.get('access-control-allow-headers'),/Authorization/);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
test('local browser keys override the local server key without changing that server configuration',async()=>{
 const received=[];const server=createCoachServer({apiKey:'local-owner-key',coach:async(payload,options)=>{received.push(options.apiKey);return {text:'Advice'};}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const headers of [{Authorization:'Bearer '+first},{}])assert.equal((await fetch(base+'/api/chat',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:'{"message":"Help"}'})).status,200);
  assert.deepEqual(received,[first,'local-owner-key']);
 }finally{await new Promise(resolve=>server.close(resolve));}
});
