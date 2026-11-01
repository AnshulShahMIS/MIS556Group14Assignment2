import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {normalizeApiBase,apiEndpoint,readApiBase} from '../dist/api-client.mjs';
import {buildPages} from '../scripts/build-pages.mjs';
test('downloaded local copies bypass the public backend configuration',async()=>{
 for(const host of ['localhost','127.0.0.1','[::1]']){
  const base=await readApiBase(()=>{throw Error('Local use must not load the hosted API address');},host);
  assert.equal(apiEndpoint(base,'/api/chat'),'/api/chat');
 }
 const base=await readApiBase(async()=>({ok:true,json:async()=>({apiBaseUrl:'https://coach.example'})}),'anshulshahmis.github.io');
 assert.equal(base,'https://coach.example');
});
test('public API configuration accepts HTTPS and excludes credential-bearing addresses',()=>{
 assert.equal(normalizeApiBase('https://coach.example/'),'https://coach.example');
 assert.equal(apiEndpoint('https://coach.example','/api/chat'),'https://coach.example/api/chat');
 assert.equal(normalizeApiBase('http://127.0.0.1:4173/'),'http://127.0.0.1:4173');
 for(const value of ['http://coach.example','https://user:password@coach.example','https://coach.example?key=secret','javascript:alert(1)'])assert.throws(()=>normalizeApiBase(value));
});
test('Pages artifact includes assets only, supports a project path and requires a deployed API address',()=>{
 const output=join(mkdtempSync(join(tmpdir(),'career-pages-')),'site');
 assert.throws(()=>buildPages({root:join(output,'missing-source'),output,apiBaseUrl:''}),/repository variable/);
 buildPages({output,apiBaseUrl:'https://coach.example'});
 assert.equal(existsSync(join(output,'index.html')),true);assert.equal(existsSync(join(output,'server-env.mjs')),false);assert.equal(existsSync(join(output,'.env')),false);
 assert.equal(JSON.parse(readFileSync(join(output,'api-config.json'),'utf8')).apiBaseUrl,'https://coach.example');
 const html=readFileSync(join(output,'index.html'),'utf8');assert.match(html,/src="chat\.mjs(?:\?v=[^"]+)?"/);assert.doesNotMatch(html,/src="\/chat.mjs"/);
});
