import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localAIEnabled} from '../dist/ai-connection.mjs';
test('only a configured loopback server enables AI; public status can never enable shared credentials',()=>{
 for(const host of ['localhost','127.0.0.1','[::1]']){assert.equal(localAIEnabled({configured:true},host),true);assert.equal(localAIEnabled({configured:false},host),false);}
 for(const host of ['anshulshahmis.github.io','example.com','localhost.evil.example',undefined])assert.equal(localAIEnabled({configured:true},host),false);
 assert.equal(localAIEnabled(null,'localhost'),false);
});
test('shipped interface has read-only setup help, no key dialog, credential collector or Authorization attachment',()=>{
 const script=readFileSync(new URL('../dist/chat.mjs',import.meta.url),'utf8'),html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(script,/createTabKey|tabKey|type='password'|visitor-key|openAISettings|data-api-secret/);
 assert.doesNotMatch(html,/id="api-settings"|id="connect-ai"|type="password"/);
 assert.match(script,/Never add a real key to .env.example or any committed GitHub file/);assert.match(script,/headers:\{'Content-Type':'application\/json'\}/);assert.match(html,/Run AI locally/);
});
