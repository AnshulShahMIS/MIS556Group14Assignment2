# Offer specialist evaluation — Stride 0.11.0

Evaluated November 5, 2026 using fictional offers. No real student offers or credentials are committed. These are automated engineering checks and browser QA, not student feedback or evidence that advice is financially appropriate.

## Recorded full-suite results

| Step | Passed | Failed | Scope |
| --- | ---: | ---: | --- |
| Unchanged baseline | 147 | 0 | Existing regression suite |
| 1: deterministic offer tools | 154 | 0 | Compensation math, cliffs, validation, missing terms, dated COL, draft placeholders, chat JSON |
| 2: agent integration | 158 | 0 | Fourth specialist routing, combined offer + plan, required comparison evidence, protected negotiation draft |
| 3: UI and adapter parity | 164 | 0 | Offline form/store/tab, edit/delete/limit, single-agent parity, Responses tool selection and invalid-context rejection |
| 4: release verification | 164 | 0 | Full suite after documentation/version updates; static Pages build and credential scan passed |
| Hosted API regression suite | 3 | 0 | Mirrored modules, visitor-key isolation, status/CORS and request validation |

Run the dependency-free suite with `node --test tests/*.test.mjs`. Existing prompt-injection, budget and partial-failure cases remain unchanged. The prior adapter assertion was updated only from “three” to “four” coordinator specialists. Provider responses in automated tests are scripted, not live model quality measurements.

## Math case checked independently

Fictional Alpha: base $100,000; target annual bonus 10%; signing $5,000; relocation $2,000; equity $40,000 over four years with a one-year cliff; employer matches 50% of employee contributions up to 6% of base. Assumes employee contributes the cap.

- Annual bonus: $10,000; first-year equity: $10,000; annual employer contribution: $3,000.
- Year one: $130,000. Four years: $499,000, counting signing/relocation only once.
- With a two-year cliff, year one is $120,000 and four years remains $499,000 under the stated cliff catch-up assumption.
- A base-only offer shows complete totals **Not listed**, a known disclosed subtotal, and no complete-total ranking. Unknown cities receive no guessed COL index.

The seven-day deadline flag uses UTC calendar dates. A passed deadline is flagged separately. Equity without schedule/cliff details stays unknown and flagged; default vesting duration is explicitly labelled four years. A signing bonus triggers a repayment-terms verification flag, not a claim that a clawback definitely exists.

## Browser QA without a key

Opened the actual app at a dedicated localhost preview with the server API key explicitly empty. Confirmed PRACTICE mode, the Offers tab and starter prompt. Entered Fictional Alpha through the website form and observed $130,000 year one, $499,000 four years and national-reference COL index 100. The automated DOM test also saves, edits, deletes and renders persisted offers without fetch or AI access.

## Limits and remaining evaluation

- No paid live offer-model test or human/student usability study was performed for this release. Mock tests prove protocol/routing enforcement, not every real model’s response quality.
- No live market salary feed, tax calculation, equity price forecast, offer acceptance, negotiation sending or account sync is implemented.
- BEA 2024 metro price levels are a dated approximation. Remote (US) uses an explicit national reference, not the person’s actual home costs.
- Natural-language offer text is available to the coach as untrusted conversation; deterministic calculation inputs must come from the form or explicit validated offer JSON.
- Negotiation drafts use an application-owned template. Reasons/ask absent from original student text become placeholders; model rewrites cannot substitute unsupported achievements or market salaries.
- Four specialists are available; at most three are consulted sequentially in a request, once each. Global model-call budget 16 and HTTP timeout 120 seconds are unchanged.

## Changed-file map

| File | Change |
| --- | --- |
| offer-tools.mjs | Node re-export of canonical browser/server offer tools |
| dist/offer-tools.mjs | Validation, comparison, dated COL lookup, chat JSON and guarded negotiation template |
| dist/offer-col.mjs | Verified public BEA snapshot: 30 metros plus national Remote (US) assumption |
| multi-agent.mjs | Fourth scoped specialist, routing, evidence enforcement, trace/artifacts and protected draft |
| openai-multi-agent.mjs | Offer context and descriptions in separate Responses loops |
| dist/single-agent.mjs | Same tools, comparison evidence and safe draft for baseline parity |
| openai-agent.mjs | Shared offer context validation, JSON input, tool descriptions and forced evidence |
| draft-checks.mjs | Application-owned negotiation draft preservation |
| dist/core-v2.mjs | Six original, cited offer guidance summaries |
| dist/offer-workspace.mjs | Offline offer form, table, rankings, assumptions, edit/delete and discussion |
| dist/workspace-store.mjs | Backward-compatible offer persistence and four-offer limit |
| dist/workspace-ui.mjs | Offers tab and chat handoff |
| dist/chat.mjs | Validated offer context, per-chat restoration and practice-mode navigation |
| dist/index.html | Starter prompt and refreshed frontend asset references |
| dist/workspace.css | Responsive comparison table |
| tests/offer-tools.test.mjs | Deterministic tool, validation, flags, draft and JSON regressions |
| tests/offer-workspace.test.mjs | Actual tab and offline UI/store regression checks |
| tests/multi-agent.test.mjs | Offer routing, combined request, evidence and draft regressions |
| tests/openai-multi-agent.test.mjs | Fourth-specialist adapter assertions and validated context |
| tests/single-agent.test.mjs | Offer baseline parity and protected draft |
| README.md | Offer usage, professor-key setup, semantics and limitations |
| docs/Multi-Agent-Architecture.md | Four-specialist table, flow, tool scope and unchanged budgets |
| evaluation/Offer-Specialist.md | This report and changed-file inventory |
| package.json | Version 0.11.0; no dependency changes |
| server-http.mjs | API status version 0.11.0 |

Hosted backend mirrors the changed agent/tool/RAG modules under lib/coach. Its lib/hosted-api.mjs and tests/hosted-api.test.mjs update status/capability assertions; visitor-key authentication and owner-key isolation remain in force.
