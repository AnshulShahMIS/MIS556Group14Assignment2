# Run Stride with your own .env file

This download contains Stride's interface, multi-agent backend and career tools. No API key is included. Add your own OpenAI key to a private local `.env` file; the website has no key-entry form. Never insert a real key into a GitHub file or .env.example.

## Quick start

1. Install **Node.js 22 or newer**. Check with `node --version` in a new terminal.
2. Download the complete project and **extract the ZIP**. Open the folder containing `serve.mjs`, `dist`, and `.env.example`. Do not run the launcher from inside the ZIP.
3. Copy **`.env.example`** and name the copy exactly **`.env`** beside `serve.mjs`. On Windows, turn on **View → Show → File name extensions** in File Explorer so the file does not become `.env.txt`.
4. Open `.env` in a text editor, fill in your own key, and save:

   ```env
   OPENAI_API_KEY=your_own_OpenAI_API_key_here
   OPENAI_MODEL=gpt-4.1-mini
   ```

5. On Windows, double-click **Start-Stride.cmd**. On Windows, macOS or Linux, you can instead open a terminal in that folder and run:

   ```sh
   node serve.mjs
   ```

6. Open **http://127.0.0.1:4177**. Confirm **MULTI-AGENT** and **Local AI mode**, then ask a short career question. The local server supplies the key; there is no need to enter it again on the page.

Keep the terminal open while using Stride. Press **Ctrl+C** to stop it. Restart it after editing `.env`. No `npm install`, GitHub account or deployment is required to run this download.

```text
Stride/
  .env              ← your private file; never share it
  .env.example      ← blank, safe-to-share template
  serve.mjs
  Start-Stride.cmd
  dist/
```

## What the key enables

Your key runs the coordinator, resume, interview, career-planning and offer-evaluation specialists, plus live job search and employer research. Usage is billed to your own OpenAI API account. Model access, available API quota and internet access are required. A ChatGPT subscription is separate from API access.

The server reads `.env` outside the public `dist` folder. It does not send the key to the browser or include it in chats or exports. Messages, supplied document text and recent context are sent to OpenAI for AI replies. Public role/company keywords are used for web research. Use fictional or redacted inputs for evaluation.

## Troubleshooting

- **Practice mode:** Check the filename is `.env`, it is beside `serve.mjs`, and `OPENAI_API_KEY` is filled in. Restart the server.
- **Different key used:** An existing `OPENAI_API_KEY` system environment variable takes priority over `.env`. Remove or update it before restarting.
- **Node not recognized:** Install Node.js 22+, then open a new terminal.
- **Port in use:** Stop an older Stride server before starting this copy; it may have loaded different settings.
- **AI request fails:** Check the displayed error, API quota/billing and model permissions.

Chats, plans, companies and application notes remain in the same browser until removed. `.env` is ignored by Git, but manually zipping the configured folder can still include it. Do not share your configured `.env` or any ZIP containing it.

## Public website

The public interface is https://anshulshahmis.github.io/MIS556Group14Assignment2/. **GitHub Pages cannot read a .env file from your computer.** For file-based configuration, use the **localhost** address above. The public website provides practice tools and offline offer calculations. Its AI setup button links to these instructions; it does not collect keys. Only your downloaded local copy reads the private .env.
