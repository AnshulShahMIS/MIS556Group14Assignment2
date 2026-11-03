import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze} from '../dist/engine.mjs';
import {uniqueManualRequirements} from '../dist/manual-requirements.mjs';
test('repeated clearance requirements collapse despite bullets, case and trailing punctuation',()=>{
 const text='This role requires an active TOP SECRET clearance and ability to maintain a CI polygraph';
 const result=analyze('Built Python scripts for a fictional university research project.',text+'\n'+text+'.\n• '+text.toLowerCase()+'.\nA masters degree is required.','Cyber analyst');
 assert.equal(result.manualReview.length,2);assert.equal(result.manualReview[0],text);
});
test('deduplication retains different clearance levels and experience durations',()=>{
 assert.equal(uniqueManualRequirements(['Active Secret clearance.','Active Top Secret clearance.','Minimum 1–2 years of experience.','Minimum 3 years of experience.']).length,4);
});
test('duplicate requirements do not consume the eight-item review limit',()=>{
 const lines=['Active Top Secret clearance.','Active Top Secret clearance.',...Array.from({length:8},(_,i)=>`Task ${i+1} requires ${i+1} years of experience.`)];
 const result=analyze('Built Python scripts for a fictional university research project.',lines.join('\n'),'Analyst');
 assert.equal(result.manualReview.length,8);assert.match(result.manualReview.at(-1),/Task 7/);
});
