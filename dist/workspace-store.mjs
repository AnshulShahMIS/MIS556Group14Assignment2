export const workspaceKey='career-compass-workspace-v1';
export const applicationStatuses=['To apply','In progress','Applied'];
const text=(v,max=1000)=>String(v??'').slice(0,max);
export function safePostingLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}
export function createWorkspaceStore(storage,{now=()=>new Date().toISOString()}={}){
 const read=()=>{const raw=storage.getItem(workspaceKey);if(!raw)return {version:1,plans:[],jobs:[]};const s=JSON.parse(raw);if(s.version!==1||!Array.isArray(s.plans)||!Array.isArray(s.jobs))throw Error('Saved workspace could not be read. Existing data was not replaced.');return s;};
 const change=fn=>{const s=read();fn(s);storage.setItem(workspaceKey,JSON.stringify(s));return s;};
 return {
  read,
  savePlan(plan,chatId){return change(s=>{
   const content=text(plan.text,24000);if(!content.trim())throw Error('The plan is empty.');
   if(s.plans.some(p=>p.chatId===chatId&&p.text===content))return;
   if(s.plans.length>=50)throw Error('You have 50 saved plans. Remove one before saving another.');
   s.plans.unshift({id:crypto.randomUUID(),chatId:text(chatId,100),title:text(plan.title||'Your career plan',160),text:content,weeks:Array.isArray(plan.weeks)?plan.weeks.slice(0,12).map(w=>({week:text(w.week,40),title:text(w.title,160),text:text(w.text,3000),deliverable:text(w.deliverable,1000),check:text(w.check,1000)})):[],completed:[],createdAt:now()});
  });},
  addJobs(jobs,chatId,query=''){return change(s=>{
   for(const raw of jobs.slice(0,20)){
    const url=safePostingLink(raw.url);if(!url)continue;
    const existing=s.jobs.find(j=>j.url===url);const fields={url,title:text(raw.title,200),employer:text(raw.employer,200),location:text(raw.location,240),salary:text(raw.salary,240),posted:text(raw.posted,160),query:text(query,500),chatId:text(chatId,100),seenAt:now()};
    if(existing)Object.assign(existing,fields);
    else {if(s.jobs.length>=150)throw Error('Your tracker has 150 jobs. Remove an old job to save another.');s.jobs.unshift({...fields,id:crypto.randomUUID(),status:'To apply',tracked:false,notes:'',deadline:'',appliedAt:''});}
   }
  });},
  updateJob(id,patch){return change(s=>{const job=s.jobs.find(j=>j.id===id);if(!job)throw Error('Job not found.');if(patch.status!==undefined){if(!applicationStatuses.includes(patch.status))throw Error('Choose a valid application status.');job.status=patch.status;job.tracked=true;if(patch.status==='Applied'&&!job.appliedAt)job.appliedAt=now().slice(0,10);if(patch.status!=='Applied')job.appliedAt='';}if(patch.tracked!==undefined)job.tracked=!!patch.tracked;if(patch.notes!==undefined)job.notes=text(patch.notes,4000);if(patch.deadline!==undefined)job.deadline=/^\d{4}-\d{2}-\d{2}$/.test(patch.deadline)?patch.deadline:'';});},
  completeWeek(id,index,done){return change(s=>{const plan=s.plans.find(p=>p.id===id);if(!plan||!Number.isInteger(index)||index<0||index>=plan.weeks.length)throw Error('Plan step not found.');const set=new Set(plan.completed);done?set.add(index):set.delete(index);plan.completed=[...set];});},
  remove(kind,id){return change(s=>{if(!['jobs','plans'].includes(kind))throw Error('Invalid collection.');s[kind]=s[kind].filter(x=>x.id!==id);});},
  detachChat(chatId){return change(s=>{for(const p of [...s.plans,...s.jobs])if(p.chatId===chatId)p.chatId='';});}
 };
}
