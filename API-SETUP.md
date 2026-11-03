# Use your own API key

## Public website

Open https://anshulshahmis.github.io/MIS556Group3Assignment2/, choose API key, enter your OpenAI API key in the password field, and choose Use key for this tab. Send a career question to check authentication, model access and quota. Use Clear my key when finished. A refresh or closed tab requires re-entry.

The app sends your credential over HTTPS through the configured Career Compass backend to OpenAI for each AI request. Only use this feature if you trust the site and its hosting. Your account pays for the model calls. The app does not put this key in GitHub files, chat history, exports or browser storage. Public requests without a key cannot use an owner-key fallback; practice templates remain available.

## Optional local copy

Download and extract the project. With Node.js 22+ installed, run Setup-API-Key.cmd to save a private .env beside serve.mjs, then Start-Career-Compass.cmd. Open http://127.0.0.1:4177. Input in the setup prompt is hidden. Do not edit the PowerShell script to insert the key, and do not share the folder after adding .env. No npm install is needed.

A local server key can also be temporarily overridden using the website’s API key button. Clearing that override restores the local copy’s configured server key. The public hosted site always requires a visitor key instead.
