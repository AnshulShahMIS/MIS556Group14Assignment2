# Career Compass with GitHub Pages

**Professor / independent evaluation:** Download and extract this repository, then follow [PROFESSOR-START-HERE.md](PROFESSOR-START-HERE.md) to run your own copy with your own API key. Windows setup and start launchers are included. Localhost always uses the local backend, without a shared-key fallback.

The public interface runs on GitHub Pages. AI requests go to a separate Node backend; GitHub Pages cannot execute the server or protect an API key in browser code. This repository includes both components and a deployment workflow. It does not include credentials or real student resumes.

## Deployment order

1. Use the public repository AnshulShahMIS/MIS556Group3Assignment2 and push this project to main. Do not upload a .env file. The public backend URL is configured in dist/api-config.json; a repository variable can override it.
2. The primary AI backend is deployed at https://career-compass-student-coach.buzzychar19.chatgpt.site and has passed status, CORS preflight and a synthetic live AI request. For alternative hosting, deploy the Node backend from this repository to a Node web host. A Render Blueprint is included in render.yaml. It selects the free web service plan and starts node serve.mjs. Set OPENAI_API_KEY privately in the hosting service, never in public assets. The service must supply PORT and its public HTTPS URL (Render supplies RENDER_EXTERNAL_URL automatically). For another host set BACKEND_PUBLIC_URL explicitly.
3. Set the backend ALLOWED_ORIGINS value to https://anshulshahmis.github.io. This is the origin, without the repository path. It authorizes browser requests from the Pages site. CORS is not authentication: non-browser callers can still reach a public API.
4. Confirm the backend /api/status responds and test one real AI request. Copy the actual deployed backend URL; no backend URL is live merely because a configuration file exists.
5. On GitHub open Settings → Secrets and variables → Actions → Variables. Optionally create CAREER_COMPASS_API_URL containing a replacement public HTTPS backend URL. The existing default is already configured. This value is public, not a secret. Do not put the OpenAI key here.
6. Open Settings → Pages and choose GitHub Actions as the publishing source. Run the Publish Career Compass to GitHub Pages workflow. It tests the source, builds a static-only artifact, and deploys it.
7. Use the URL returned by the successful Pages deployment. A proposed username.github.io path is not verification that publication succeeded. Test from another browser/device and verify AI MODE and a real answer.

## What is deployed to Pages

scripts/build-pages.mjs copies only dist assets to .pages and creates api-config.json containing the backend address. HTML, modules, CSS and PDF.js assets use relative paths so a repository subpath works. The workflow uploads .pages, not the repository root. Neither server code nor .env is part of that artifact. The workflow fails on an absent API URL and scans for project-key strings.

## Local testing

Requires Node.js 22 or later; no npm installation is needed for the Node app or tests.

    node --test tests/*.test.mjs
    node serve.mjs

The local copy uses a root .env or the OPENAI_API_KEY environment variable. Run Setup-API-Key.cmd to configure an extracted local copy. A blank dist/api-config.json uses the same local server. For a separate local backend, edit only the public apiBaseUrl field; use localhost HTTP for development or HTTPS for a public server.

## AI and privacy

One model-driven agent uses guidance retrieval plus comparison, resume review, planning and interview tools. Student messages, supplied documents, recent history, optional goals and retrieved passages are transmitted through the backend to OpenAI. The key stays server-side. store:false is requested but does not promise zero provider retention. Use redacted or fictional data for demonstration. Source IDs are validated; claim support, citation relevance and personal facts still require review.

The backend has a 90-second request timeout, six model decisions, a 1,500-token output limit per model call, two simultaneous requests, 20 attempts per minute and 60 attempts per UTC day per server process. These counters reset on process restart and are not a durable distributed quota or guaranteed dollar spending cap. Use provider billing controls as appropriate. Free hosts can sleep or impose availability limits; verify the live service before presentation. No student input is persisted by this app's backend.

## Verification and readiness

91 automated tests pass, including the existing career and adapter tests plus Pages artifact boundaries, relative assets, API configuration, CORS preflight and the shared process request limit. The existing live development checks were performed on version 0.4; this version's final public end-to-end test is pending actual deployment. Do not present the application as online until both deployments and a public AI request have been verified.

Real student usefulness testing, broader citation evaluation and the final five-minute presentation remain. The assignment permits selected career needs and does not require a multi-agent architecture.

References: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages and https://render.com/docs/web-services.

## Conversation history in version 0.6

New conversation preserves the previous chat. Reopen saved chats from the sidebar or Chats button on mobile. Messages, resume/job context, goals, added guidance, drafts and recent model conversation context are saved in this browser's local storage. Chats do not sync across devices. Up to 25 chats are retained; older chats are not silently deleted. Delete controls remove the selected chat locally. Storage failures are surfaced so the student can export the current conversation.

Browser storage is not encrypted and can be accessed by people using the same browser profile. Use redacted inputs and delete chats on shared devices. Clearing site data removes saved chats. Conversations closed before this feature existed were not saved and cannot be recovered. Export an existing conversation before the first refresh that loads this update.
