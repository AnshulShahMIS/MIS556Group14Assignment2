import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {localAIEnabled} from '../dist/ai-connection.mjs';
test('only a configured loopback server enables AI; public status can never enable shared credentials',()=>{
 for(const host of ['localhost','127.0.0.1','[::1]']){assert.equal(localAIEnabled({configured:true},host),true);assert.equal(localAIEnabled({configured:false},host),false);}
 for(const host of ['anshulshahmis.github.io','example.com','localhost.evil.example',undefined])assert.equal(localAIEnabled({configured:true},host),false);
 assert.equal(localAIEnabled(null,'localhost'),false);
});
test('public visitor key path is explicit, tab-only and cleared across page lifecycle events',()=>{
 const script=readFileSync(new URL('../dist/chat.mjs',import.meta.url),'utf8'),html=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
 assert.match(script,/tabKey\.has\(\)\|\|localAIEnabled\(apiConfig\)/);assert.match(script,/\.\.\.tabKey\.headers\(\)/);
 assert.match(script,/pagehide[\s\S]*?tabKey\.clear\(\)/);assert.match(script,/pageshow[\s\S]*?tabKey\.clear\(\)/);assert.match(html,/Use AI with my key/);
 assert.doesNotMatch(script,/connectPublicDemo|localStorage\.setItem\([^\n]*key/i);
});
