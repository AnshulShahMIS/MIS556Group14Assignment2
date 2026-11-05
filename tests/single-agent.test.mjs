import test from 'node:test';import assert from 'node:assert/strict';import {runSingleAgent,executeTool,agentTools} from '../dist/single-agent.mjs';
test('runtime retrieves then returns known citations using a scripted test provider',async()=>{let step=0;const r=await runSingleAgent({message:'Help with resume',decide:async state=>step++===0?{type:'tool',name:'search_guidance',arguments:{query:'resume evidence'}}:{type:'final',kind:'guidance',text:'Review your evidence.',sourceIds:[state.history[0].output[0].id]}});assert.equal(r.trace.length,1);assert.equal(r.sources.length,1)});
test('missing provider fails without fake AI output',async()=>assert.rejects(()=>runSingleAgent({message:'Hello'}),/not connected/));
test('unsupported delegation is rejected',async()=>assert.rejects(()=>runSingleAgent({message:'Help me',decide:async()=>({type:'tool',name:'delegate_to_agent'})}),/Unsupported/));
test('step budget bounds tool loops',async()=>assert.rejects(()=>runSingleAgent({message:'Help',maxSteps:2,decide:async()=>({type:'tool',name:'search_guidance',arguments:{query:'resume'}})}),/step limit/));
test('unknown citations fail',async()=>assert.rejects(()=>runSingleAgent({message:'Help',decide:async()=>({type:'final',text:'Advice',sourceIds:['invented']})}),/unknown source/));
test('guidance requires retrieval',async()=>assert.rejects(()=>runSingleAgent({message:'Help',decide:async()=>({type:'final',kind:'guidance',text:'Advice'})}),/retrieved source/));
test('clarification may precede retrieval',async()=>assert.equal((await runSingleAgent({message:'Help',decide:async()=>({type:'final',kind:'clarification',text:'Which role?'})})).trace.length,0));
test('unknown arguments fail',()=>assert.throws(()=>executeTool('search_guidance',{query:'resume',url:'https://example.com'}),/Unexpected/));
test('missing comparison inputs fail',()=>assert.throws(()=>executeTool('compare_resume_job',{},{}),/40 characters/));
test('cancellation prevents work',async()=>{const c=new AbortController();c.abort();await assert.rejects(()=>runSingleAgent({message:'Help',signal:c.signal,decide:async()=>({})}),/cancelled/)});
test('tool surface has no inter-agent delegation',()=>assert.equal(agentTools.filter(t=>/agent|delegate/i.test(t.name)).length,0));
test('single-agent offer baseline retrieves and compares before guidance and preserves safe negotiation template',async()=>{
 const r=await runSingleAgent({message:'Draft a negotiation email for my offer.',context:{offers:[{company:'Fictional',baseSalary:90000,location:'Remote (US)'}]},decide:async s=>{
  if(s.requiredTool)return {type:'tool',name:s.requiredTool,arguments:s.requiredTool==='search_guidance'?{query:'offer compensation'}:{}};
  if(s.history.length===2)return {type:'tool',name:'draft_negotiation',arguments:{offer:'1',reasons:'My invented achievement',ask:'$150000 market rate'}};
  return {type:'final',kind:'guidance',text:'I deserve $150000.',sourceIds:[s.history[0].output[0].id]};
 }});assert.equal(r.offerComparison.offers[0].baseSalary,90000);assert.match(r.text,/\[your stated, supportable reason\]/);assert.doesNotMatch(r.text,/150000|invented achievement/);assert.deepEqual(r.trace.map(s=>s.tool),['search_guidance','compare_offers','draft_negotiation']);
});
