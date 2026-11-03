// Opt-in live regression: fictional student inputs only.
import {writeFile} from 'node:fs/promises';
import {runOpenAIMultiAgent} from '../openai-multi-agent.mjs';
import {sampleResume,sampleJob} from '../dist/engine.mjs';
const results=[];
for(const [id,context,tool] of [
 ['resume-and-job',{resume:sampleResume,job:sampleJob},'compare_resume_job'],
 ['resume-only',{resume:sampleResume},'review_resume']
]){
 try{
  const answer=await runOpenAIMultiAgent({message:id==='resume-only'?'Review my resume and suggest truthful improvements.':'Compare my resume with this job. Explain supported requirements and uncertainties.',context},{signal:AbortSignal.timeout(120000)});
  const passed=answer.trace.some(step=>step.agent==='Resume specialist'&&step.tool===tool&&step.status==='completed');
  results.push({id,requiredTool:tool,passed,...answer});console.log(JSON.stringify({id,requiredTool:tool,passed,modelCalls:answer.usage.modelCalls}));
 }catch(error){results.push({id,passed:false,error:error.message});console.log(JSON.stringify({id,error:error.message}));}
}
await writeFile(new URL('./resume-evidence-live-results.json',import.meta.url),JSON.stringify({date:'2026-11-03',scope:'Two fictional development checks of mandatory tool execution, not factual-quality validation.',results},null,2)+'\n');
if(results.some(row=>!row.passed))process.exitCode=1;
