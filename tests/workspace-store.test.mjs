import test from 'node:test';import assert from 'node:assert/strict';
import {createWorkspaceStore,workspaceKey} from '../dist/workspace-store.mjs';
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
test('career plans persist separately by chat and retain versions and completion',()=>{
 const storage=memory(),store=createWorkspaceStore(storage);store.savePlan({title:'Analyst plan',text:'Four-week analyst plan',weeks:[{title:'Build project'}]},'chat-a');store.savePlan({text:'A different plan'},'chat-b');store.savePlan({text:'Four-week analyst plan'},'chat-a');assert.equal(store.read().plans.length,2);
 const plan=store.read().plans.find(p=>p.chatId==='chat-a');store.completeWeek(plan.id,0,true);const fresh=createWorkspaceStore(storage);assert.deepEqual(fresh.read().plans.find(p=>p.id===plan.id).completed,[0]);assert.equal(fresh.read().plans.length,2);
});
test('refreshed job recommendations preserve application progress and notes',()=>{
 const storage=memory(),store=createWorkspaceStore(storage,{now:()=> '2026-11-05T12:00:00Z'}),url='https://jobs.example.com/123';store.addJobs([{title:'Analyst',employer:'Example',url}],'chat-a');const id=store.read().jobs[0].id;
 store.updateJob(id,{status:'In progress',notes:'Finish cover letter',deadline:'2026-11-20'});store.addJobs([{title:'Updated analyst',url}],'chat-b');let job=createWorkspaceStore(storage).read().jobs[0];assert.equal(job.status,'In progress');assert.equal(job.notes,'Finish cover letter');assert.equal(job.chatId,'chat-b');assert.equal(store.read().jobs.length,1);
 store.updateJob(id,{status:'Applied'});job=store.read().jobs[0];assert.equal(job.appliedAt,'2026-11-05');assert.equal(job.tracked,true);store.updateJob(id,{status:'To apply'});assert.equal(store.read().jobs[0].appliedAt,'');assert.throws(()=>store.updateJob(id,{status:'Auto-submitted'}),/status/);
});
test('invalid links are rejected and deleting a chat leaves tracked work available without a dangling link',()=>{
 const store=createWorkspaceStore(memory());store.addJobs([{title:'Unsafe',url:'javascript:alert(1)'},{title:'Safe',url:'https://jobs.example.com/1'}],'chat-a');store.savePlan({text:'Plan'},'chat-a');store.detachChat('chat-a');assert.equal(store.read().jobs.length,1);assert.equal(store.read().jobs[0].chatId,'');assert.equal(store.read().plans[0].chatId,'');
});
test('corrupt storage and quota failure do not overwrite saved work',()=>{
 const storage=memory();storage.setItem(workspaceKey,'broken');assert.throws(()=>createWorkspaceStore(storage).savePlan({text:'New'},'a'));assert.equal(storage.getItem(workspaceKey),'broken');
 const failing={getItem:()=>null,setItem:()=>{throw Error('Quota exceeded');}};assert.throws(()=>createWorkspaceStore(failing).addJobs([{url:'https://jobs.example.com/1'}],'a'),/Quota/);
});
