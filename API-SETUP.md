# Stride API setup

See [PROFESSOR-START-HERE.md](PROFESSOR-START-HERE.md) for the complete evaluation setup.

1. Extract the project and install Node.js 22+.
2. Copy `.env.example` to `.env` beside `serve.mjs`.
3. Add your own `OPENAI_API_KEY`; keep `OPENAI_MODEL=gpt-4.1-mini` unless intentionally selecting a compatible model.
4. Run `Start-Stride.cmd` on Windows, or `node serve.mjs` in a terminal.
5. Open http://127.0.0.1:4177. No browser key entry is needed.

Restart after changing `.env`. An existing system environment variable takes priority over the file. The optional `Setup-API-Key.cmd` helper can also create `.env` through a hidden prompt.

Keep `.env` outside `dist`, GitHub, shared ZIPs and screenshots. The blank `.env.example` may be shared. AI requests use your own account and require API quota.

GitHub Pages cannot load your local `.env` file. The public site separately supports per-tab visitor keys.
