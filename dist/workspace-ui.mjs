import {createWorkspaceStore,workspaceKey,applicationStatuses,safePostingLink} from './workspace-store.mjs';
import {appendJobLinks} from './job-links.mjs';
export function mountWorkspace({storage=localStorage,getChatId,getLastReply,openChat,ask,notify}){
 const store=createWorkspaceStore(storage),$=s=>document.querySelector(s);
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,fn,cls='chip')=>{const b=el('button',text,cls);b.type='button';b.addEventListener('click',fn);return b;};
 const run=fn=>{try{fn();render();}catch(e){notify(e.message||'Could not save this workspace.');}};
 const nav=el('nav',undefined,'workspace-tabs');nav.setAttribute('role','tablist');nav.setAttribute('aria-label','Career workspace');
 const panels=new Map();let selected='chat';
 const titles={chat:'Chat',plan:'Career Plan',jobs:'Recommended Jobs',applications:'Applications'};
 for(const [id,title]of Object.entries(titles)){
  const tab=button(title,()=>show(id),'workspace-tab');tab.id='tab-'+id;tab.dataset.tab=id;tab.setAttribute('role','tab');tab.setAttribute('aria-controls',id==='chat'?'chat-scroll':'workspace-'+id);nav.append(tab);
  if(id!=='chat'){const panel=el('section',undefined,'workspace-panel');panel.id='workspace-'+id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',tab.id);panel.hidden=true;panels.set(id,panel);}
 }
 $('.workspace > header').after(nav);for(const panel of panels.values())$('.workspace').append(panel);
 $('#chat-scroll').setAttribute('role','tabpanel');$('#chat-scroll').setAttribute('aria-labelledby','tab-chat');
 function show(id){selected=id;$('#chat-scroll').hidden=id!=='chat';$('.composer-area').hidden=id!=='chat';for(const [key,p]of panels)p.hidden=key!==id;for(const b of nav.children){const on=b.dataset.tab===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;}render();}
 nav.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const tabs=[...nav.children],i=tabs.findIndex(b=>b.dataset.tab===selected),n=event.key==='Home'?0:event.key==='End'?tabs.length-1:(i+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;show(tabs[n].dataset.tab);tabs[n].focus();});
 const heading=(p,title,desc)=>{p.replaceChildren(el('h1',title),el('p',desc,'workspace-intro'));};
 const empty=(p,text,label,fn)=>{const box=el('div',undefined,'workspace-empty');box.append(el('p',text));if(label)box.append(button(label,fn));p.append(box);};
 const discuss=(item,prompt)=>{show('chat');openChat(item.chatId||'');ask(prompt+'\n\nSaved context:\n'+(item.text||[item.title,item.employer,item.location,item.url,item.notes].filter(Boolean).join('\n')).slice(0,12000));};
 function plans(state){
  const p=panels.get('plan');heading(p,'Your career plans','Plans created with the coach are saved here, including earlier versions. Revisit one to keep working on it.');
  p.append(button('Create a career plan',()=>{show('chat');ask('Create a practical four-week career plan based on my experience and goals. Ask for any essential context you still need.');}));
  p.append(button('Save last chat reply as a plan',()=>run(()=>{const text=getLastReply?.();if(!text)throw Error('Open the chat containing your plan first.');store.savePlan({title:'Plan saved from chat',text},getChatId());})));
  if(!state.plans.length)return empty(p,'No plan saved yet. Ask the coach to create one, and it will appear here.');
  for(const plan of state.plans){const card=el('article',undefined,'workspace-card');card.append(el('h2',plan.title),el('small',new Date(plan.createdAt).toLocaleDateString()+' · '+(plan.chatId===getChatId()?'Current chat':'Saved plan')));const prose=el('p',undefined,'saved-prose');appendJobLinks(prose,plan.text);card.append(prose);
   for(const [i,w]of plan.weeks.entries()){const label=el('label',undefined,'workspace-milestone'),check=el('input');check.type='checkbox';check.checked=plan.completed.includes(i);check.addEventListener('change',()=>run(()=>store.completeWeek(plan.id,i,check.checked)));label.append(check,el('span',w.week+' · '+w.title+' — '+w.text));card.append(label);}
   const tools=el('div',undefined,'workspace-actions');tools.append(button('Discuss this plan',()=>discuss(plan,'Help me review and update this saved career plan.')),button('Remove plan',()=>{if(confirm('Remove this saved plan? Its original chat will remain.'))run(()=>store.remove('plans',plan.id));}));card.append(tools);p.append(card);}
 }
 function postingCard(job,tracker=false){
  const card=el('article',undefined,'workspace-card');card.append(el('h2',job.title||'Job posting'),el('p',[job.employer,job.location].filter(Boolean).join(' · '),'job-company'));
  if(job.salary)card.append(el('p','Salary: '+job.salary));if(job.posted)card.append(el('p','Posted: '+job.posted));card.append(el('small','Retrieved '+new Date(job.seenAt).toLocaleDateString()+' · Confirm availability on the employer page.'));
  const actions=el('div',undefined,'workspace-actions');if(safePostingLink(job.url)){const link=el('a','View posting / apply ↗','chip');link.href=job.url;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);}
  actions.append(button('Discuss with coach',()=>discuss(job,'Help me assess this job against my experience and prepare the next application step.')));
  if(!tracker)actions.append(button(job.tracked?'View in Applications':'Track application',()=>{run(()=>store.updateJob(job.id,{tracked:true}));show('applications');}));card.append(actions);
  if(tracker){const controls=el('div',undefined,'application-controls'),label=el('label','Application status'),select=el('select');select.setAttribute('aria-label','Application status for '+job.title);for(const status of applicationStatuses){const o=el('option',status);o.value=status;select.append(o);}select.value=job.status;select.addEventListener('change',()=>run(()=>store.updateJob(job.id,{status:select.value})));label.append(select);controls.append(label);
   const dl=el('label','Application deadline (optional)'),date=el('input');date.type='date';date.value=job.deadline;date.addEventListener('change',()=>run(()=>store.updateJob(job.id,{deadline:date.value})));dl.append(date);controls.append(dl);
   const nl=el('label','Notes / steps still needed'),notes=el('textarea');notes.rows=3;notes.maxLength=4000;notes.value=job.notes;notes.placeholder='Example: tailor resume, finish cover letter, submit application';nl.append(notes);controls.append(nl,button('Save notes',()=>run(()=>store.updateJob(job.id,{notes:notes.value}))));if(job.appliedAt)controls.append(el('small','Marked applied: '+job.appliedAt));controls.append(button('Stop tracking',()=>run(()=>store.updateJob(job.id,{tracked:false}))));card.append(controls);
  }return card;
 }
 function jobs(state){const p=panels.get('jobs');heading(p,'Recommended jobs','Actual postings found by the coach, using your shared experience and search preferences. Saved results can become outdated.');
  const form=el('form',undefined,'job-search-form'),role=el('input'),location=el('input');role.placeholder='Target role (optional)';role.maxLength=160;role.setAttribute('aria-label','Target job role');location.placeholder='Location or remote preference';location.maxLength=160;location.setAttribute('aria-label','Job location or remote preference');const go=el('button','Find jobs with my experience','chip');go.type='submit';form.append(role,location,go);form.addEventListener('submit',e=>{e.preventDefault();show('chat');ask('Find actual '+(role.value.trim()||'suitable')+' job postings'+(location.value.trim()?' in '+location.value.trim():'')+' based on the experience I have shared. Return individual application links.');});p.append(form);
  if(!state.jobs.length)return empty(p,'No job results saved yet. Run a search above or ask the coach to find actual postings.');for(const job of state.jobs)p.append(postingCard(job));
 }
 function applications(state){const p=panels.get('applications');heading(p,'Your applications','Track your own progress. Opening a posting does not submit an application; mark Applied only after you have submitted it yourself.');
  const tracked=state.jobs.filter(j=>j.tracked),counts=el('div',undefined,'application-counts');for(const status of applicationStatuses)counts.append(el('span',status+': '+tracked.filter(j=>j.status===status).length));p.append(counts);
  p.append(button('Add a job manually',()=>{const title=prompt('Job title');if(!title?.trim())return;const employer=prompt('Employer (optional)')||'',url=prompt('HTTPS link to the posting');if(!safePostingLink(url)){notify('Enter a valid HTTPS posting link.');return;}run(()=>{const next=store.addJobs([{title,employer,url}],getChatId(),'Added manually');const saved=next.jobs.find(j=>j.url===safePostingLink(url));store.updateJob(saved.id,{tracked:true});});}));
  if(!tracked.length)return empty(p,'No applications tracked yet. Save a recommended job or add one manually.');
  for(const status of applicationStatuses){const group=el('section',undefined,'application-group');group.append(el('h2',status==='In progress'?'In progress · finish these applications':status));for(const job of tracked.filter(j=>j.status===status))group.append(postingCard(job,true));if(!tracked.some(j=>j.status===status))group.append(el('p','No jobs in this stage.','small-note'));p.append(group);}
 }
 function render(){try{const state=store.read();if(selected==='plan')plans(state);if(selected==='jobs')jobs(state);if(selected==='applications')applications(state);if(selected!=='chat')panels.get(selected).append(el('p','Saved in this browser only. Plans, jobs and application notes do not sync across devices. Avoid sensitive details on shared computers.','small-note'));}catch(e){notify(e.message);}}
 window.addEventListener('storage',e=>{if(e.key===workspaceKey)render();});show('chat');
 return {showChat:()=>show('chat'),saveAnswer(answer){run(()=>{if(answer.careerPlan)store.savePlan(answer.careerPlan,getChatId());if(answer.jobSearch?.jobs?.length)store.addJobs(answer.jobSearch.jobs,getChatId(),answer.jobSearch.query);});},savePlan(plan){run(()=>store.savePlan(plan,getChatId()));},detachChat(id){run(()=>store.detachChat(id));}};
}
