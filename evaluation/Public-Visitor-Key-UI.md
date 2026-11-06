# Public visitor OpenAI key dialog

The public Stride interface again supports each visitor’s own OpenAI key. The updated dialog follows the supplied reference with an OpenAI dashboard link, masked input, privacy/billing explanation, loaded/empty status, and Use key for this tab, Clear key and Cancel buttons. It uses Stride’s navy/red palette. It accepts an OpenAI API key, not a Gemini key or a ChatGPT website login.

**174/174 application tests passed.** Three added dialog tests cover masked entry and disclosures, key use/clear without echo, and invalid entry/cancel behavior. The prior local-only UI assertion was replaced to test explicit transient visitor-key use and lifecycle clearing. Existing visitor-key isolation, backend owner-fallback rejection, tool budgets, offer math, chat storage and agent regressions continue passing.

Accepted keys live only in the createTabKey closure. Dialog inputs are cleared on use/cancel/close, and closure state is cleared on refresh/page exit, cached-page restoration or provider authentication rejection. Keys are forwarded only in request Authorization headers to the configured service and never become model context. The app writes no key to browser storage, chats, exports, source files or a database. This depends on trusting the website and service; browser key entry is not a secret vault. Actual authentication, quota and model access are checked by the first AI request, not the format-only dialog validation.

The hosted API still requires a visitor key and never uses the owner key as a public fallback. Local users may keep using a private .env instead. A tab key explicitly overrides that local key until cleared. ChatGPT subscription billing and OpenAI API billing are separate. No Gemini integration, shared-owner testing, team-code flow or loopback demo connection is included in the current workflow.

Sources: [OpenAI authentication guidance](https://developers.openai.com/api/reference/overview), [ChatGPT and API billing](https://help.openai.com/en/articles/9039756-managing-billing-for-chatgpt-and-the-api-platform).
