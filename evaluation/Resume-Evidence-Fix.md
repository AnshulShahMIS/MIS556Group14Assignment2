# Resume evidence execution and duplicate review fix — version 0.7.1

The resume specialist must retrieve guidance and complete an evidence tool before finalizing when sufficient resume text is available. With a job description it must complete compare_resume_job; with only a resume it must complete review_resume. The runtime validates completion independently of the provider’s forced tool choice. A failed tool does not satisfy the requirement. Without sufficient inputs, no review is fabricated.

Manual-review requirements now deduplicate matching lines while ignoring case, whitespace, leading bullets, dash variants and trailing sentence punctuation. Different clearance levels, durations and other distinct requirements remain separate. Deduplication happens before the eight-item limit. Saved chat evidence panels receive the same cleanup when reopened. Historic tool traces remain accurate; the app does not retroactively claim an evidence tool ran on an old reply.

118 automated tests passed. New regression checks cover duplicated clearance text, preservation of different requirements, the eight-item limit, mandatory review/comparison execution, rejection of a model attempting to skip comparison, unavailable evidence tools without inputs, and forced tool choice plus replay of its actual output in the Responses API adapter.

Two fictional live API checks passed: resume/job comparison and resume-only review both used the required tool, taking five model calls each. The browser sample also completed comparison. A second browser comparison used a fictional job with the same clearance requirement three times; the evidence panel displayed it once alongside the two distinct degree/duration requirements. The trace showed Resume specialist · compare resume job — completed.

This validates tool execution and display behavior, not factual accuracy or hiring eligibility. Generated interpretations and citation support still need review. The public single-agent app is unchanged.

Restart the local server and refresh the browser to load the fix. Send a new review/comparison request to see its actual evidence-tool event. The prepared workspace launcher uses the existing private API configuration; the distributable ZIP contains no key.
