import test from 'node:test';
import assert from 'node:assert/strict';
import {interviewDraftFeedback,wantsInterviewDraft} from '../draft-checks.mjs';
const message='Now draft my interview introduction using my Tableau class project.';
test('draft regression checks catch advice-only output and unsupported project tasks',()=>{
 assert.equal(wantsInterviewDraft(message),true);
 assert.match(interviewDraftFeedback('Describe your project and contribution.',{message}),/first-person/);
 assert.match(interviewDraftFeedback('I built the dashboard from scratch, selected metrics and performed data-quality checks.',{message}),/did not supply/);
});
test('supported or placeholder details remain available in a first-person draft',()=>{
 assert.equal(interviewDraftFeedback('I built a Tableau dashboard. My contribution was [describe your metrics and data-quality checks, if applicable].',{message}),'');
 assert.equal(interviewDraftFeedback('I built the dashboard from scratch.',{message:message+' I built it from scratch.'}),'');
 assert.equal(wantsInterviewDraft('Do not draft an answer. Start a mock interview.'),false);
});
