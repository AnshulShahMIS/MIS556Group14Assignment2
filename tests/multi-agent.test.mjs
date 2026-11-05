import test from 'node:test';
import assert from 'node:assert/strict';
import {runMultiAgent,specialists} from '../multi-agent.mjs';
import {knowledge,sampleResume,sampleJob} from '../dist/engine.mjs';
const context={docs:knowledge,resume:sampleResume,job:sampleJob};
const tool=(name,args={})=>({type:'tool',name,arguments:args});
const final=(state,text='I am preparing for this opportunity.')=>({type:'final',kind:'guidance',text,sourceIds:state.sourceIds.slice(0,1)});
const conversation=text=>({type:'final',kind:'conversation',text,sourceIds:[]});
function scripted(ids,{action,inspect}={}){
 return async state=>{
  inspect?.(state);
  if(state.agentId==='coordinator')return state.history.length<ids.length?tool('consult_'+ids[state.history.length],{task:'Help with the original task.'}):final(state,'I am using these grounded next steps.');
  if(!state.history.length)return tool('search_guidance',{query:state.agentId==='interview'?'interview STAR':state.agentId==='resume'?'resume evidence':'career exploration'});
  if(state.requiredTool)return tool(state.requiredTool);
  if(action&&!state.history.some(item=>item.tool===action))return tool(action);
  return final(state);
 };
}
test('offer questions route to fourth specialist with retrieval then deterministic evidence',async()=>{
 const offers=[{company:'Fictional Acme',location:'Phoenix, AZ',baseSalary:90000}];
 const result=await runMultiAgent({message:'I got an offer; is it fair?',context:{docs:knowledge,offers},decide:scripted(['offer'],{inspect:state=>{if(state.agentId==='coordinator'&&!state.history.length)assert.equal(state.requiredTool,'consult_offer');if(state.agentId==='offer')assert.deepEqual(state.tools.map(t=>t.name).sort(),state.remainingSteps===1?[]:['compare_offers','draft_negotiation','search_guidance']);}})});
 assert.deepEqual(result.agentsUsed,['Offer evaluation specialist']);assert.equal(result.offerComparison.offers[0].baseSalary,90000);assert.deepEqual(result.trace.filter(e=>['consult_offer','search_guidance','compare_offers'].includes(e.tool)&&e.status!=='started').map(e=>e.tool),['search_guidance','compare_offers','consult_offer']);assert.ok(result.modelCalls<=16);
});
test('combined offer and onboarding plan consults offer and career within original consultation budget',async()=>{
 const result=await runMultiAgent({message:'Compare my offers and make a 30-day onboarding plan.',context:{...context,offers:[{company:'Fictional',location:'Remote (US)',baseSalary:80000}]},decide:scripted(['offer','career'])});
 assert.deepEqual(result.agentsUsed,['Offer evaluation specialist','Career planning specialist']);assert.ok(result.modelCalls<=16);assert.ok(result.careerPlan);
});
test('offer evidence cannot be skipped after retrieval or replaced by model estimates',async()=>{
 await assert.rejects(()=>runMultiAgent({message:'Compare my offer.',context:{docs:knowledge,offers:[{company:'Fictional',baseSalary:80000,location:'Phoenix, AZ'}]},decide:async state=>{if(state.agentId==='coordinator')return state.history.length?final(state):tool('consult_offer',{task:'Compare'});if(!state.history.length)return tool('search_guidance',{query:'offer compensation'});assert.equal(state.requiredTool,'compare_offers');return final(state,'This is worth $500000.');}}),/could not complete/);
});
test('offer negotiation tool protects draft from unsupported specialist and coordinator embellishments',async()=>{
 const result=await runMultiAgent({message:'Draft a negotiation email for my offer.',context:{docs:knowledge,offers:[{company:'Fictional',baseSalary:80000,location:'Phoenix, AZ'}]},decide:async state=>{if(state.agentId==='coordinator')return state.history.length?final(state,'I led a $10M project.'):tool('consult_offer',{task:'Draft'});if(state.requiredTool)return tool(state.requiredTool,state.requiredTool==='search_guidance'?{query:'offer negotiation'}:{});if(state.history.length===2)return tool('draft_negotiation',{offer:'1',reasons:'I led a $10M project',ask:'$200000 market salary'});return final(state,'I deserve $200000.');}});
 assert.match(result.text,/\[your stated, supportable reason\]/);assert.doesNotMatch(result.text,/10M|200000|deserve/);
});
test('career plan replies expose a separate saved artifact with generated weekly steps',async()=>{
 const result=await runMultiAgent({message:'Create a four-week career plan.',context,decide:scripted(['career'],{action:'create_plan'})});
 assert.equal(result.careerPlan.text,result.text);assert.equal(result.careerPlan.weeks.length,4);assert.ok(result.careerPlan.createdAt);
 const greeting=await runMultiAgent({message:'hello',decide:async()=>conversation('Hello')});assert.equal(greeting.careerPlan,undefined);
});
test('independent specialist loops retrieve before coordinator synthesis',async()=>{
 const result=await runMultiAgent({message:'Review my resume and help me plan my next step.',context,decide:scripted(['resume','career'])});
 assert.deepEqual(result.agentsUsed,['Resume specialist','Career planning specialist']);assert.equal(result.modelCalls,8);
 assert.equal(result.sources.length,1);assert.equal(result.partial,false);
 assert.ok(result.trace.some(s=>s.agent==='Resume specialist'&&s.tool==='search_guidance'&&s.status==='completed'));
 assert.ok(result.trace.some(s=>s.agent==='Career coordinator'&&s.tool==='consult_career'));
 assert.equal(JSON.stringify(result.trace).includes(sampleResume),false);
});
test('resume specialist executes evidence tools with original context',async()=>{
 const result=await runMultiAgent({message:'Review my resume.',context,decide:scripted(['resume'],{action:'review_resume',inspect:state=>assert.equal(state.context.resume,sampleResume)})});
 assert.ok(result.trace.some(s=>s.tool==='review_resume'&&s.status==='completed'));
});
test('resume-only reviews require the review tool before final guidance',async()=>{
 const result=await runMultiAgent({message:'Review my resume.',context:{...context,job:''},decide:scripted(['resume'])});
 assert.ok(result.trace.some(s=>s.tool==='review_resume'&&s.status==='completed'));
 assert.equal(result.trace.some(s=>s.tool==='compare_resume_job'),false);
});
test('resume specialist cannot skip comparison after retrieval even if model returns a cited answer',async()=>{
 await assert.rejects(()=>runMultiAgent({message:'Compare my resume with this job.',context,decide:async state=>{
  if(state.agentId==='coordinator')return state.history.length?conversation('Unavailable.'):tool('consult_resume',{task:'Compare evidence.'});
  if(!state.history.length)return tool('search_guidance',{query:'resume evidence'});
  assert.equal(state.requiredTool,'compare_resume_job');return final(state);
 }}),/could not complete/);
});
test('without a resume the specialist asks for input without inventing a completed review',async()=>{
 const result=await runMultiAgent({message:'Review my resume.',context:{docs:knowledge},decide:scripted(['resume'],{inspect:state=>{
  if(state.agentId==='resume')assert.equal(state.tools.some(t=>['review_resume','compare_resume_job'].includes(t.name)),false);
 }})});
 assert.equal(result.trace.some(s=>s.tool==='review_resume'||s.tool==='compare_resume_job'),false);
});
test('follow-ups retain conversation while changing specialists',async()=>{
 const history=[{role:'user',content:'I study MIS and built a Tableau dashboard.'},{role:'assistant',content:'Let’s explore analyst roles.'}];
 await runMultiAgent({message:'Now draft my introduction using that project.',context,conversation:history,decide:scripted(['interview'],{inspect:state=>{
  assert.equal(state.conversation,history);assert.match(state.message,/draft my introduction/);
  if(state.agentId==='interview')assert.equal(state.tools.some(t=>t.name==='create_plan'),false);
 }})});
});
test('greetings need no specialist or retrieval',async()=>{
 const result=await runMultiAgent({message:'hello',decide:async state=>{assert.equal(state.agentId,'coordinator');return conversation('Hello! What are you working toward?');}});
 assert.equal(result.modelCalls,1);assert.deepEqual(result.sources,[]);assert.deepEqual(result.agentsUsed,[]);
});
test('coordinator cannot produce uncited career guidance without consulting',async()=>{
 await assert.rejects(()=>runMultiAgent({message:'Review my resume.',decide:async()=>({type:'final',kind:'guidance',text:'Your resume is perfect.',sourceIds:[]})}),/citations|consultation/);
});
test('specialists cannot execute another agent’s tools or delegate',async()=>{
 for(const action of ['create_plan','consult_resume'])await assert.rejects(()=>runMultiAgent({message:'Interview help',context,decide:async state=>{
  if(state.agentId==='coordinator')return state.history.length?conversation('No results.'):tool('consult_interview',{task:'Draft an answer.'});
  return state.history.length?tool(action):tool('search_guidance',{query:'interview'});
 }}),/could not complete/);
 assert.equal(specialists.interview.tools.includes('review_resume'),false);
});
test('three specialists fit within the global call budget',async()=>{
 const result=await runMultiAgent({message:'Review my resume, draft my introduction and make a plan.',context,decide:scripted(['resume','interview','career'])});
 assert.equal(result.agentsUsed.length,3);assert.ok(result.modelCalls<=16);
});
test('duplicate consultations and unknown agents are blocked',async()=>{
 for(const name of ['consult_resume','consult_unknown'])await assert.rejects(()=>runMultiAgent({message:'help',context,decide:async state=>state.agentId==='coordinator'?tool(state.history.length?name:'consult_resume',{task:'Review resume.'}):!state.history.length?tool('search_guidance',{query:'resume'}):state.requiredTool?tool(state.requiredTool):final(state)}),/permitted scope/);
});
test('partial failure preserves successful findings and reports missing work',async()=>{
 const base=scripted(['resume','interview']);
 const result=await runMultiAgent({message:'Resume review and interview help',context,decide:state=>{if(state.agentId==='interview')throw Error('sensitive-provider-body');return base(state);}});
 assert.equal(result.partial,true);assert.deepEqual(result.agentsUsed,['Resume specialist']);assert.match(result.text,/couldn’t complete the interview specialist/);assert.equal(JSON.stringify(result).includes('sensitive-provider-body'),false);
});
test('fabricated specialist citations cannot reach the final reply',async()=>{
 await assert.rejects(()=>runMultiAgent({message:'help',context,decide:async state=>state.agentId==='coordinator'?(state.history.length?conversation('Sorry.'):tool('consult_career',{task:'Help.'})):state.history.length?{type:'final',kind:'guidance',text:'Advice',sourceIds:['fabricated']} : tool('search_guidance',{query:'career'})}),/could not complete/);
});
test('cancellation and global budget prevent further calls',async()=>{
 let calls=0;const controller=new AbortController();controller.abort();
 await assert.rejects(()=>runMultiAgent({message:'help',signal:controller.signal,decide:()=>{calls++;}}),/cancelled/);assert.equal(calls,0);
 await assert.rejects(()=>runMultiAgent({message:'help',context,limits:{modelCalls:1},decide:async()=>{calls++;return tool('consult_resume',{task:'Help.'});}}),/model-call limit/);assert.equal(calls,1);
});
test('specialists must retrieve before generating advice',async()=>{
 await assert.rejects(()=>runMultiAgent({message:'help',context,decide:async state=>state.agentId==='coordinator'?(state.history.length?conversation('Unavailable.'):tool('consult_resume',{task:'Help.'})):conversation('No retrieval needed.')}),/could not complete/);
});
