import {classifyInterviewRequest} from './dist/interview-assist.mjs';
export function wantsInterviewDraft(message){
 if(/\b(?:don['’]t|do not)\s+(?:write|draft)\b/i.test(message))return false;
 return classifyInterviewRequest(message)?.intent==='interview-draft'||/\b(?:draft|write)\b.*\b(?:interview|introduction|answer)\b/i.test(message);
}
// Targeted regression checks, not a general factuality or semantic validator.
export function interviewDraftFeedback(text,{message,context={},conversation=[]}){
 if(!wantsInterviewDraft(message))return '';
 const problems=[];
 if(!/\bI(?: am| study| built|’m|'m| have| recently)\b/.test(text))problems.push('Provide an actual first-person interview draft now, not instructions about what the student should write.');
 const supplied=[message,context.resume,context.profile?.experience,...conversation.filter(m=>m.role==='user').map(m=>m.content)].filter(Boolean).join('\n');
 const claims=[['stakeholder',/stakeholder/i],['metrics',/\bmetrics?\b/i],['data quality checks',/data[- ]quality|data validation/i],['dataset or data source',/dataset|data source/i],['building from scratch',/from scratch/i],['defining a business problem',/business problem/i],['personal interests',/strong interest|keenly interested|deepened my interest|enthusiasm/i],['claimed skills improvement',/honed|improved my|strengthened my|developed skills|developed foundational skills/i]];
 const prose=text.replace(/(?:developed skills|honed|improved my|strengthened my)\s*(?:in|of)?\s*\[[^\]\n]*\]/gi,'').replace(/\[[^\]\n]*\]/g,'');
 const unsupported=claims.filter(([,pattern])=>pattern.test(prose)&&!pattern.test(supplied)).map(([label])=>label);
 if(unsupported.length)problems.push('The student did not supply these project details: '+unsupported.join(', ')+'. Omit them or put them inside bracketed placeholders. Do not state them as completed personal actions.');
 return problems.join(' ');
}
