# Run Career Compass with your own API key

This download contains the complete app and local server. No API key is included.
When opened at localhost, the app uses this computer's server and API configuration.
No npm install, GitHub account, deployment, or editing of GitHub files is required.

## Windows quick start

1. Install Node.js 22 or newer if it is not already installed. Check with `node --version` in a new terminal.
2. Right-click the project ZIP and choose **Extract All**. Open the extracted folder containing `serve.mjs`, `dist`, and the launchers. Do not run the launchers from inside the ZIP.
3. Double-click **Setup-API-Key.cmd**. In the terminal prompt, paste your own OpenAI API key and press Enter. Input is hidden. The helper saves it to `.env` beside `serve.mjs` and checks authentication without printing the key. Do not edit the PowerShell script to insert a key.
4. Double-click **Start-Career-Compass.cmd** and keep its terminal window open.
5. After the listening message, open **http://127.0.0.1:4177**. Confirm **MULTI-AGENT** and send a short career question. Generation uses your API account and requires available API quota and model access. Authentication alone does not confirm generation works.
6. Press Ctrl+C in the server window when finished.

## Manual setup (Windows, macOS, or Linux)

Create a plain-text file named exactly `.env` (not `.env.txt`) beside `serve.mjs`:

```env
OPENAI_API_KEY=replace_with_your_own_key
OPENAI_MODEL=gpt-4.1-mini
```

Open a terminal in that folder and run:

```sh
node serve.mjs
```

Then open http://127.0.0.1:4177. The local server runs without installing npm packages.
An existing OPENAI_API_KEY environment variable takes priority over `.env`; remove or update that variable if you want to use the file instead.

## Troubleshooting and privacy

- **Setup opens as text:** Run `Setup-API-Key.cmd`, not the `.ps1` file.
- **Node is not recognized:** Install Node.js 22 or newer, then open a new terminal.
- **Practice mode:** Check `.env` is beside `serve.mjs` and restart the server after changing the key. There is no fallback to the shared public AI backend on localhost.
- **Port already in use:** Close an older Career Compass server before starting this copy. An existing server at that address may use different configuration.
- **AI error:** Read the error in the chat; confirm your API account has quota and access to the configured model.
- Keep `.env` private. It is ignored by Git, but manually zipping the folder can still include it. Do not upload or email the folder after adding your key.
- The local backend sends supplied messages, document text, context, and retrieved guidance to OpenAI for AI replies. Use fictional or redacted inputs for evaluation.
- Chats and document context remain in this browser's storage until deleted. They do not sync between computers. Delete demonstration chats on shared devices.
- The public GitHub Pages link is a separate hosted deployment. These instructions configure only your downloaded copy; they do not change the public site's key or access.
