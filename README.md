# Stride — multi-agent career coach (0.11.1)

## Professor setup: private .env file

Download and extract this project, copy `.env.example` to `.env` beside `serve.mjs`, and add your own OpenAI key. Run `Start-Stride.cmd` or `node serve.mjs`, then open **http://127.0.0.1:4177**. No browser key entry or npm installation is needed. Full instructions: [PROFESSOR-START-HERE.md](PROFESSOR-START-HERE.md). Keep `.env` private; GitHub Pages cannot read a file on your computer.

A conversational career coach for college students, with resume/job evidence checks, interview drafting and practice, role exploration, and four-week plans.

Public interface: https://anshulshahmis.github.io/MIS556Group14Assignment2/

GitHub Pages serves the interface. The separate hosted AI backend is configured in dist/api-config.json. Its status endpoint reports the active architecture; verify MULTI-AGENT in the interface after deployment. An API key must never be added to GitHub or public assets.

## Agent team and RAG

A career coordinator selects resume, interview, career planning and offer evaluation specialists based on the request and recent conversation. Each specialist runs its own model/tool loop, with separate instructions and restricted tools. The coordinator combines completed findings into one reply. Greetings can be answered directly.

Specialists retrieve the career guidance library before generation. Resume analysis must also complete compare_resume_job when both documents are present, or review_resume when only the resume is available. Source IDs are validated at both layers; claim support and personal facts still need review. Sources and actual agent activity appear in a collapsed panel below replies.

See [architecture and limits](docs/Multi-Agent-Architecture.md) and [the evidence-tool fix](evaluation/Resume-Evidence-Fix.md). The same configurable model, gpt-4.1-mini by default, runs the distinct agent roles.

## Credentials: private local .env only

The interface has no key-entry form. On the public GitHub Pages site, AI setup opens read-only setup instructions. Practice tools and the Offers calculator work without credentials. For live AI, download the project and follow PROFESSOR-START-HERE.md to create your own private local .env. Never edit a GitHub source file to insert a real key. .env.example is only a blank template, not a place to upload a credential. GitHub Pages cannot execute the Node backend or read your computer’s .env. GitHub Actions secrets must never be built into frontend files.

The browser enables live AI only on localhost with a configured local server. It sends no visitor Authorization header and does not collect, store or manage a browser key. The existing hosted API continues rejecting unauthenticated calls and never falls back to the owner key; removing the form does not expose shared owner-funded AI.

## Run your own copy with your own API key

Install Node.js 22 or newer, download and fully extract the repository, then follow [PROFESSOR-START-HERE.md](PROFESSOR-START-HERE.md). Windows users can run Setup-API-Key.cmd, then Start-Career-Compass.cmd. Open http://127.0.0.1:4177 and keep the server window open. No npm install is needed for the local Node app.

On macOS/Linux, create a private .env beside serve.mjs with OPENAI_API_KEY and optionally OPENAI_MODEL, then run node serve.mjs. Never upload .env. Localhost always uses its own server configuration, without falling back to the public backend. An existing OPENAI_API_KEY environment variable takes priority over .env.

Without an API key, practice mode uses local templates and does not run AI agents. For a single-agent comparison, set CAREER_COMPASS_AGENT_MODE=single-agent in the server environment before starting.

## GitHub Pages publication

The Publish Stride to GitHub Pages workflow tests the project, builds a static-only artifact and deploys it on pushes to main. Set Pages to GitHub Actions. The public backend URL comes from dist/api-config.json or the optional CAREER_COMPASS_API_URL repository variable. The value is a public URL, never an API key. Pages cannot execute the Node backend or keep browser credentials secret.

AI backend changes require a separate backend deployment. Uploading this repository alone does not update that service. A compatible Node backend is included for independent hosting; render.yaml is an optional example, not a claim that a Render service has been deployed.

## Testing and limits

166 automated tests pass with node --test tests/*.test.mjs. Fictional development results are in evaluation/. Live scripts are opt-in paid API checks, not part of the offline suite. They do not establish real student usefulness or guaranteed factual accuracy. Student feedback and the final presentation remain.

Each request has at most 16 model calls, three sequential specialist consultations and a 120-second HTTP timeout. Specialist calls cap output at 1,200 tokens; coordinator calls at 1,500. Multiple agents can increase latency and input/output usage. Local and hosted request counters are process/isolate-local, reset on restart, and are not durable billing caps.

Messages, supplied document text, recent history and relevant guidance are sent through the backend to OpenAI in AI mode. Credentials are loaded by the local server from a private .env or environment variable and are never entered in the browser. store:false is requested; this does not promise zero provider retention. Use redacted inputs. Up to 25 chats, including supplied context, remain in this browser until deleted; they do not sync across devices. No API keys or real student resumes are packaged in this repository.

## Find actual job postings

In AI mode ask, for example: "Find cybersecurity analyst jobs in Phoenix and remote US roles." The planning specialist uses live OpenAI web search and checks individual employer/ATS posting pages before returning title, employer, location, available date/salary and application links. Missing details are labelled Not listed. Indexed postings can be stale and matching is imperfect; confirm availability and requirements on the employer page.

Search uses two model calls within the existing request budget, plus OpenAI web-search charges on your own API account. Search keywords are sent to OpenAI web search; the complete resume is not used as the search query. Live search runs in the downloaded local app using your private .env; the public interface does not collect keys. Supported-source coverage and checks are documented in [evaluation/Live-Job-Search.md](evaluation/Live-Job-Search.md).

## Career workspace tabs

Chat, Career Plan, Recommended Jobs and Applications keep generated work available to revisit. Plans save versions and weekly completion. Actual job-search results can be tracked as To apply, In progress or Applied, with deadlines and notes. Discuss with coach reopens the original chat. Older plans can be saved explicitly from the latest chat reply. The tracker never submits applications. Everything is saved in the same browser; there is no account sync.

## Employer research and favorite companies

The Employer Research tab searches live web sources for a named company, its products, dated recent news, careers information and suggested interview questions. It saves a cited briefing that can be refreshed or discussed in chat. Favorite Companies stores a shortlist and personal notes; companies can be saved without a key or directly from a job card. Refreshing research preserves favorites and notes. Records remain in this browser, without account synchronization.

Employer research is a scoped tool of the career planning specialist, with one extra model/web-search call inside the existing request budget. Only public company and optional role keywords enter the search request. Missing search evidence fails visibly rather than producing a model-memory company report. Source validation does not establish that every factual claim is supported.

## Offer evaluation — 0.11.1

The fourth specialist evaluates student-supplied offers and drafts negotiation emails. The coordinator routes offer/compensation/negotiation requests to `consult_offer`; combined offer-and-plan requests consult both offer and career. There are four available specialists, but at most three unique specialists per request, unchanged from the previous version.

Open **Offers** beside Career Plan. Add up to four offers, edit/delete them and compare compensation without an API key. Nothing is synced to an account. The form accepts disclosed annual USD amounts; blank values stay **Not listed**, while confirmed absent benefits can be entered as 0. Incomplete packages show disclosed subtotals and are excluded from complete-total rankings. The retirement fields mean employer match rate on employee contributions, up to the entered contribution cap as a percentage of base. The calculator assumes contribution up to that cap.

**Discuss with coach** attaches the validated offers to the current chat. AI discussion and negotiation require the professor’s own `.env` key locally, using the downloaded local app. Offers remain in that chat’s context until a new chat is started. Offers can also be pasted in chat as JSON using the exact field names below; the same validator rejects unsupported fields and invalid numbers. Natural-language offer letters are untrusted text: use the form or JSON to provide calculation inputs rather than relying on model extraction.

```json
{"offers":[{"company":"Fictional Alpha","role":"Graduate Analyst","location":"Phoenix, AZ","baseSalary":90000,"annualBonusTargetPct":5,"signingBonus":2000,"relocation":0,"equityTotalValue":0,"retirementMatchPct":0,"ptoDays":15}]}
```

Other optional fields: `annualBonus` (instead of `annualBonusTargetPct`), `vestingYears` (default 4), `cliffYears`, `retirementMatchCapPct`, `remotePolicy`, `startDate`, `expiresOn`, `notes`. Dates use YYYY-MM-DD. Equity assumes linear vesting with cliff catch-up and constant grant value, subject to actual agreement terms. Signing/relocation are counted once. Four-year projections hold base and target bonus constant and do not predict raises or taxes. Unknown vesting/cliff terms remain flagged.

The bundled COL snapshot covers 30 US metros using BEA 2024 all-items Regional Price Parities, released February 19, 2026 and checked November 5, 2026. Remote (US) explicitly uses the national reference 100; unknown locations receive no adjustment. This is a dated approximation, not a personal budget, salary benchmark, or financial/legal advice. The tool ranks numbers, never decides which offer to accept. Review terms with appropriate career, benefits, legal or financial advisers.

See [offer evaluation results](evaluation/Offer-Specialist.md) and [architecture](docs/Multi-Agent-Architecture.md). All automated offer examples are fictional; paid live offer-model checks have not been represented as completed.
