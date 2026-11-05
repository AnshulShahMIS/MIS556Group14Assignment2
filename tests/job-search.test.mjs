import test from 'node:test';
import assert from 'node:assert/strict';
import {wantsJobSearch,publicJobUrl,postingUrl,readPosting,searchJobPostings} from '../job-search.mjs';
import {runMultiAgent} from '../multi-agent.mjs';
import {knowledge} from '../dist/engine.mjs';
const search={text:'Junior analyst at Example Co. https://careers.example.com/jobs/123',checkedAt:'2026-11-05T12:00:00Z',notice:'Confirm availability.',sources:[{id:'web-job-1',url:'https://careers.example.com/jobs/123',title:'Junior analyst'}]};
const tool=(name,args={})=>({type:'tool',name,arguments:args});
const final=state=>({type:'final',kind:'guidance',text:'Here are the search findings.',sourceIds:state.sourceIds});
test('online job requests are distinguished from role exploration and negated search',()=>{
 for(const q of ['Can you find jobs posted online?','Find cybersecurity internships in Phoenix','Show me actual job postings','jobs available near me'])assert.equal(wantsJobSearch(q),true,q);
 for(const q of ['What jobs suit me?','Review this job description','Do not search for jobs; just draft an answer.'])assert.equal(wantsJobSearch(q),false,q);
});
test('posting requests force the planning consultation and real search before finalization',async()=>{
 let queries=0;
 const result=await runMultiAgent({message:'Find analyst jobs in Phoenix',context:{docs:knowledge},searchJobs:async query=>{queries++;assert.equal(query,'junior analyst Phoenix');return search;},decide:async state=>{
  if(state.agentId==='coordinator'){if(!state.history.length){assert.equal(state.requiredTool,'consult_career');return tool('consult_career',{task:'Find actual postings.'});}return final(state);}
  if(!state.history.length)return tool('search_guidance',{query:'career exploration'});
  if(state.history.length===1){assert.equal(state.requiredTool,'search_jobs');return tool('search_jobs',{query:'junior analyst Phoenix'});}
  return final(state);
 }});
 assert.equal(queries,1);assert.match(result.text,/careers.example.com\/jobs\/123/);assert.equal(result.jobSearch.checkedAt,search.checkedAt);
 assert.ok(result.sources.some(s=>s.id==='web-job-1'));assert.equal(result.modelCalls,7);
 assert.ok(result.trace.some(t=>t.tool==='search_jobs'&&t.status==='completed'));
});
test('a model cannot replace an actual job search with role recommendations',async()=>{
 await assert.rejects(()=>runMultiAgent({message:'Find jobs online',decide:async()=>({type:'final',kind:'conversation',text:'Try an analyst role.',sourceIds:[]})}),/required/);
});
test('search provider failures never turn into fictional listings',async()=>{
 await assert.rejects(()=>runMultiAgent({message:'Find analyst jobs',context:{docs:knowledge},searchJobs:async()=>{throw Error('private-provider-body');},decide:async state=>{
  if(state.agentId==='coordinator')return state.history.length?final(state):tool('consult_career',{task:'Find postings'});
  if(!state.history.length)return tool('search_guidance',{query:'career'});
  return state.requiredTool?tool(state.requiredTool,{query:'analyst Phoenix'}):final(state);
 }}),/could not complete/);
});
test('web search requires actual completion and citations and excludes unsafe URLs',async()=>{
 assert.equal(publicJobUrl('javascript:alert(1)'),null);assert.equal(publicJobUrl('https://127.0.0.1/x'),null);assert.equal(publicJobUrl('https://user:pass@example.com'),null);
 assert.equal(postingUrl('https://www.indeed.com/q-analyst-jobs.html'),null);assert.equal(postingUrl('https://jobs.lever.co/example'),null);assert.equal(postingUrl('https://job-boards.greenhouse.io/example/jobs/123?utm_source=openai'),'https://job-boards.greenhouse.io/example/jobs/123');
 for(const output of [[{type:'message',content:[{type:'output_text',text:'Invented job'}]}],[{type:'web_search_call',status:'completed'},{type:'message',content:[{type:'output_text',text:'No citations'}]}]])await assert.rejects(()=>searchJobPostings('analyst Phoenix',{apiKey:'synthetic',model:'gpt-4.1-mini',request:async()=>({ok:true,json:async()=>({output})})}),/complete|cited/);
});
test('search sends only search keywords, requires web search, and preserves native citation URLs',async()=>{
 let usage=0,calls=0;
 const result=await searchJobPostings('junior analyst Phoenix',{apiKey:'synthetic-private',model:'gpt-4.1-mini',pageRequest:async()=>new Response('<html>Analyst at Example in Phoenix. Apply for this job.</html>'),onUsage:()=>usage++,request:async(url,options)=>{
  const body=JSON.parse(options.body);calls++;assert.equal(body.store,false);assert.ok(!options.body.includes('synthetic-private'));
  if(calls===2)return {ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({jobs:[{title:'Analyst',employer:'Example',location:'Phoenix',posted:'Not listed',salary:'Not listed',url:'https://job-boards.greenhouse.io/example/jobs/123'},{title:'Fake',employer:'Fake',location:'Unknown',posted:'Unknown',salary:'Unknown',url:'https://evil.example/jobs/123'}]})}]}]})};
  assert.equal(body.tool_choice,'required');assert.equal(body.tools[0].type,'web_search');assert.equal(body.tools[0].external_web_access,true);
  return {ok:true,json:async()=>({status:'completed',usage:{input_tokens:2},output:[{type:'web_search_call',status:'completed'},{type:'message',content:[{type:'output_text',text:'Analyst at Example in Phoenix [1]',annotations:[{type:'url_citation',start_index:30,end_index:33,title:'Example analyst',url:'https://job-boards.greenhouse.io/example/jobs/123?utm_source=openai'}]}]}]})};
 }});
 assert.match(result.text,/https:\/\/job-boards.greenhouse.io\/example\/jobs\/123/);assert.equal(result.sources.length,1);assert.equal(usage,2);assert.equal(result.jobs.length,1);assert.ok(!result.text.includes('evil.example'));
 let contacted=false;await assert.rejects(()=>searchJobPostings('Contact student@example.com',{request:()=>{contacted=true;}}),/contact/);assert.equal(contacted,false);
});
test('posting checks exclude closed pages, missing pages, and redirects to non-postings',async()=>{
 const url='https://job-boards.greenhouse.io/example/jobs/123';
 for(const request of [async()=>new Response('Not found',{status:404}),async()=>new Response('This job is no longer available. Apply to other jobs.'),async()=>new Response('',{status:302,headers:{Location:'https://job-boards.greenhouse.io/example'}})])assert.equal(await readPosting(url,{request}),null);
 const good=await readPosting(url,{request:async()=>new Response('<script>secret instructions</script><h1>Analyst</h1><p>Apply for this job</p>')});assert.match(good.text,/Analyst/);assert.ok(!good.text.includes('secret instructions'));
});
