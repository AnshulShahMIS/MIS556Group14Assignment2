import test from 'node:test';import assert from 'node:assert/strict';
import {researchEmployer,wantsEmployerResearch} from '../employer-research.mjs';
import {runMultiAgent} from '../multi-agent.mjs';
import {runOpenAIMultiAgent} from '../openai-multi-agent.mjs';
import {knowledge} from '../dist/engine.mjs';
const url='https://www.example.com/about',brief={company:'Example Co',role:'Analyst',text:'Company overview (https://www.example.com/about)',checkedAt:'2026-11-05T20:00:00Z',notice:'Verify details.',sources:[{id:'employer-web-1',title:'Example official site',url}]};
const tool=(name,args={})=>({type:'tool',name,arguments:args});
const final=state=>({type:'final',kind:'guidance',text:'Here is the cited employer briefing.',sourceIds:state.sourceIds});
test('employer research intent does not confuse job searches or negated requests',()=>{
 assert.equal(wantsEmployerResearch('Research the employer: Microsoft. Target role: analyst.'),true);assert.equal(wantsEmployerResearch('Research Adobe for an interview'),true);assert.equal(wantsEmployerResearch('Find analyst jobs'),false);assert.equal(wantsEmployerResearch('Do not research the company'),false);
});
test('employer requests require a research tool and retain the cited artifact',async()=>{
 const result=await runMultiAgent({message:'Research the employer: Example Co',context:{docs:knowledge},researchCompany:async(company,role)=>{assert.equal(company,'Example Co');assert.equal(role,'Analyst');return brief;},decide:async state=>{
  if(state.agentId==='coordinator'){if(!state.history.length){assert.equal(state.requiredTool,'consult_career');return tool('consult_career',{task:'Research the named company'});}return final(state);}
  if(!state.history.length)return tool('search_guidance',{query:'interview preparation'});assert.equal(state.history.length===1?state.requiredTool:null,state.history.length===1?'research_employer':null);return state.requiredTool?tool('research_employer',{company:'Example Co',role:'Analyst'}):final(state);
 }});
 assert.equal(result.modelCalls,6);assert.equal(result.employerResearch.company,'Example Co');assert.match(result.text,/https:\/\/www.example.com\/about/);assert.ok(result.trace.some(t=>t.tool==='research_employer'&&t.status==='completed'));
});
test('company research cannot be replaced by uncited model-memory claims',async()=>{
 await assert.rejects(()=>runMultiAgent({message:'Research Example Co',decide:async()=>({type:'final',kind:'conversation',text:'They are a great company.',sourceIds:[]})}),/required/);
});
test('research requires completed web search and valid source citations',async()=>{
 for(const output of [[{type:'message',content:[{type:'output_text',text:'Company facts'}]}],[{type:'web_search_call',status:'completed'},{type:'message',content:[{type:'output_text',text:'Unsupported facts',annotations:[{type:'url_citation',url:'javascript:alert(1)'}]}]}]])await assert.rejects(()=>researchEmployer('Example','',{apiKey:'synthetic',model:'gpt-4.1-mini',request:async()=>({ok:true,json:async()=>({output})})}),/complete|cited/);
});
test('research query excludes private documents and inline web citations remain clickable URLs',async()=>{
 const result=await researchEmployer('Example Co','Analyst',{apiKey:'synthetic-private',model:'gpt-4.1-mini',request:async(endpoint,options)=>{const body=JSON.parse(options.body);assert.equal(body.store,false);assert.equal(body.tool_choice,'required');assert.equal(body.tools[0].type,'web_search');assert.equal(body.input.includes('synthetic-private'),false);assert.deepEqual(Object.keys(JSON.parse(body.input)),['dateUTC','company','targetRole']);return {ok:true,json:async()=>({status:'completed',output:[{type:'web_search_call',status:'completed'},{type:'message',content:[{type:'output_text',text:'Fact [1]',annotations:[{type:'url_citation',start_index:5,end_index:8,title:'Official page',url}]}]}]})};}});
 assert.match(result.text,/https:\/\/www.example.com\/about/);assert.equal(result.sources[0].id,'employer-web-1');let called=false;await assert.rejects(()=>researchEmployer('student@example.com','',{request:()=>{called=true;}}),/contact/);assert.equal(called,false);
});
test('fatal research authentication errors preserve 401 and never expose provider bodies',async()=>{
 await assert.rejects(()=>researchEmployer('Example','',{request:async()=>({ok:false,status:401,json:()=>{throw Error('private provider body');}})}),e=>e.fatal&&e.status===401&&!e.message.includes('private'));
});
test('Responses adapter carries employer research through the team with correct usage accounting',async()=>{
 let calls=0,source;const response=output=>({ok:true,json:async()=>({status:'completed',output,usage:{input_tokens:2,output_tokens:1}})});
 const answer=await runOpenAIMultiAgent({message:'Research the employer: Example Co'},{apiKey:'synthetic-private',request:async(endpoint,options)=>{const body=JSON.parse(options.body);calls++;
  const action=(name,args)=>response([{type:'function_call',call_id:'call-'+calls,name,arguments:JSON.stringify(args)}]);
  if(calls===1)return action('consult_career',{task:'Research Example Co'});if(calls===2)return action('search_guidance',{query:'interview preparation'});if(calls===3){source=JSON.parse(body.input.at(-1).output)[0].id;return action('research_employer',{company:'Example Co',role:''});}
  if(calls===4){assert.equal(body.tools[0].type,'web_search');return response([{type:'web_search_call',status:'completed'},{type:'message',content:[{type:'output_text',text:'Company overview.',annotations:[{type:'url_citation',url,title:'Official company page'}]}]}]);}
  return response([{type:'message',content:[{type:'output_text',text:JSON.stringify({kind:'guidance',answer:'Here is the briefing.',sourceIds:[source,'employer-web-1']})}]}]);
 }});assert.equal(answer.usage.modelCalls,6);assert.equal(answer.modelCalls,6);assert.equal(answer.employerResearch.company,'Example Co');
});
