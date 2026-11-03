import {normalizeVisitorKey} from './dist/tab-key.mjs';
import {CoachError} from './openai-agent.mjs';
export function visitorKeyFromHeader(header){
 if(header===undefined||header===null||header==='')return null;
 if(typeof header!=='string'||!header.startsWith('Bearer '))throw new CoachError('Use your own OpenAI API key in AI settings.',401);
 try{return normalizeVisitorKey(header.slice(7));}
 catch{throw new CoachError('The API key format is invalid. Replace it in AI settings.',401);}
}
