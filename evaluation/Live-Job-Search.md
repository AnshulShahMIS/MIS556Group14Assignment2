# Live job search — version 0.9.0

The career planning specialist now has a server-side `search_jobs` tool. Explicit requests to find postings force the coordinator to consult that specialist, and force search after guidance retrieval. It no longer completes an explicit posting request with suitable role names alone.

The tool uses OpenAI Responses web search with the visitor's request-scoped key and the existing gpt-4.1-mini model. It accepts a short role/location query, never the full resume. Search-domain filters are not supported by this model: search instructions request employer/ATS sites, and application code independently accepts only recognizable individual posting URLs on the supported domains. Job-board category/search pages are rejected.

Cited posting pages are fetched with bounded HTTPS requests and restricted redirects. Missing pages, redirects to general boards and recognizable closed-listing notices are excluded. A second bounded model call extracts title, employer, location, salary and posting date from the actual retrieved posting pages. Missing details are labelled Not listed. The application rejects links outside the retrieved, reachable, cited set, and appends the original search results to the final response so synthesis cannot remove the application links.

The tool uses two model calls within the existing 16-call request budget and 120-second request timeout. Search fees and model usage are charged to the visitor's API account. Individual source pages may receive requests from the backend, and search keywords are processed by OpenAI web search. No applications are submitted.

## Verification

136 offline application tests pass, including nine new checks covering intent, mandatory delegation/search, provider failure, unsafe/unretrieved URLs, category pages, closed/missing pages, structured result extraction, native citations, link rendering and saved-chat restoration. Hosted key isolation and origin checks remain covered by the hosted API suite.

A paid development query for cybersecurity analyst postings returned individual SmartRecruiters, iCIMS and Greenhouse pages. Direct page retrieval excluded an Ashby URL that returned 404. Posting dates were changed to Not listed where the actual page did not supply a date, instead of reusing approximate search dates. These are small development checks, not a hiring-outcome evaluation.

## Limits

Coverage is limited to supported public employer/ATS domains. Search indexes and posting pages can be stale; a reachable page does not prove a vacancy remains open. Students must verify availability, requirements and application details. Search may miss suitable postings, include imperfect role matches or fail on blocked pages. No result, inaccessible pages or unsupported account search access produces an explicit failure rather than invented jobs. General career-guidance RAG remains a separate curated library.
