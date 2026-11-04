# GitHub Pages deployment status

Prepared October 29, 2026. Version 0.5.0 separates the Pages interface from the hosted AI API.

The AI backend is publicly deployed at https://career-compass-student-coach.buzzychar19.chatgpt.site. Its status endpoint, allowed-origin preflight and a synthetic real-model request returned successful responses. The key is stored as a runtime secret, not in this repository.

The repository is AnshulShahMIS/MIS556Group14Assignment2. GitHub Pages is configured to publish through GitHub Actions. The complete source, workflow, PDF.js files and tests are committed locally. The final push requires the user's normal GitHub authentication because the connector rejected writes and the session could not use Windows' credential helper.

86 automated project tests pass; two separate hosted API tests also passed. The final GitHub Pages deployment and a browser conversation on that public Pages URL remain to be verified after the push. No live Pages URL is claimed by this status document.

Counters are per server process or Worker execution context, can reset and are not durable spending caps. Citation relevance and personal facts need review. Actual student usefulness testing and the final five-minute presentation remain pending.

Earlier readiness and live evaluation files describe version 0.4 and are retained as development evidence. This file and the root README govern the current deployment status.
