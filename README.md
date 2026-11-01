# FormFlow React SDK

[![CI](https://github.com/formizeflow/formflow-react/actions/workflows/ci.yml/badge.svg)](https://github.com/formizeflow/formflow-react/actions/workflows/ci.yml)

Thin, SSR-safe wrappers around `embed.js` (`@formizeflow/embed`, served by your FormFlow host). Add the types path `@formizeflow/react` (bundled) to your project (it declares `window.FormFlow`).

```tsx
import { FormFlowEmbed, FormFlowPopupButton, useFormFlow } from "@formizeflow/react";

// inline, one line
<FormFlowEmbed slug="contact" baseUrl="https://forms.example.com" onSubmit={(r) => console.log(r.submissionId)} />

// prefill and hidden fields, redirect-free thank-you handled by the form
<FormFlowEmbed slug="demo-request" prefill={{ email: user.email }} hidden={{ plan: "pro" }} onReady={() => setLoaded(true)} />

// side panel opened from your own button
<FormFlowPopupButton slug="feedback" mode="slider" className="btn" autoClose={2500}>Give feedback</FormFlowPopupButton>

// chat-bubble launcher with tooltip, opens after 40% scroll
<FormFlowEmbed slug="nps" mode="popover" launcher={{ icon: "chat", tooltip: "Tell us what you think" }} trigger={{ scrollPercent: 40, once: true }} />

// imperative
const { open, close, ready } = useFormFlow();
<button disabled={!ready} onClick={() => open("pricing-help", { mode: "popup" })}>Talk to sales</button>
```

Props (all optional except `slug`): `mode` (`inline` default, `popup`, `modal`, `drawer`, `slider`, `fullscreen`, `floating`, `popover`), `baseUrl` (default `NEXT_PUBLIC_FORMFLOW_URL`, then the page origin), `prefill`, `hidden`, `styles`, `buttonText`, `title`, `passQueryParams` / `transitiveSearchParams`, `prefillFromUrl`, `prefillFromDataLayer`, `autoClose` (ms after submit), `launcher`, `trigger` and the callbacks `onReady`, `onSubmit`, `onProgress`, `onError`, `onClose`. Callbacks may change every render without rebuilding the widget; changing `slug`, `mode` or any non-callback option does.

The script is fetched once from `<baseUrl>/embed.js` on the client after hydration; nothing runs on the server. In Next.js App Router, import from a Client Component (the file already has `"use client"`).
