# Resume Optimizer verification

The new tab sits immediately after Chat and uses the existing resume specialist through the coordinator. It accepts pasted text or existing PDF/DOCX/TXT/MD extraction and a separate target job description. Submitted inputs become the current chat context. It requests a grounded tailored draft, before/after edits, supported keywords, missing requirements and an application checklist, without invented claims or a fabricated ATS score.

174 application tests pass. Five new optimizer tests cover input validation, grounded prompt requirements, explicit key gating with retained inputs, context forwarding, duplicate-submit protection, text-only output, unrelated-chat isolation, retry after failure, busy-state handling and file extraction. Existing extraction, agent routing and evidence-tool tests remain passing.

Browser checks used fictional resume/job text and a deterministic local response fixture with zero model calls. Verified: key dialog opens from the optimizer, inputs remain while connecting, result appears in the optimizer, text download works, matching chat opens, key clearing works, and narrow/desktop layouts remain usable. This verifies UI plumbing rather than live model quality, API authentication or sufficient quota. The public backend continues to accept per-request visitor keys and never falls back to the owner’s key.

Working optimizer input/results live in tab memory. Submitted context and responses also remain in existing browser chat history until deleted. Reload clears the optimizer working area; saved chat retains the review. Copy/download exports the complete review, not a formatted DOCX. Generated personal facts and any proposed wording require human review.
