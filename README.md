# Surya's AI Portfolio

A portfolio you can talk to. Visitors ask a question, and an AI version of me answers from my real projects and experience, showing project, skill and contact cards. A classic one-page view at `/about` covers recruiters who are in a hurry.

```
portfolio/
├── backend/                FastAPI + Groq (Python)
│   ├── data/profile.json   ← EVERYTHING the AI knows about me. Edit this.
│   ├── app/
│   │   ├── main.py         routes: /health, /api/profile, /api/chat (streaming)
│   │   ├── chat.py         the chat loop: stream text → run tool calls → emit cards
│   │   ├── tools.py        tools the AI can call (show_projects, show_skills, ...)
│   │   ├── prompt.py       system prompt with grounding rules
│   │   ├── llm.py          Groq client behind a small interface (fake in tests)
│   │   ├── rate_limit.py   per-IP sliding-window rate limiter
│   │   └── config.py       settings from .env
│   └── tests/test_api.py   20 tests, no API key needed
├── frontend/               Next.js 16 + TypeScript + Tailwind CSS 4
│   └── src/
│       ├── app/            pages: / (landing), /chat, /about (classic view)
│       ├── components/     Chat, AskBox, Cards, ClassicView, ...
│       └── lib/            api.ts (SSE client), site.ts (landing-page info), types.ts
└── render.yaml             one-click backend deploy on Render
```

---

## 1. Run it on your laptop

**Quickest way on Windows:** double-click `start.bat` in this folder. It opens two windows, one for the backend and one for the frontend; keep both open. The first run installs everything, which takes a few minutes. When the site is ready, your browser opens http://localhost:3000. Then paste your Groq key into `backend\.env` after `GROQ_API_KEY=` and save. The backend reloads by itself.

To stop the servers, close the two windows. Next time, `start.bat` starts in seconds.

### Manual setup

You need **Python 3.11+** and **Node.js 20+**.

#### Backend (terminal 1)

```bash
cd backend
python -m venv .venv
# Windows:      .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements-dev.txt
```

Copy `.env.example` to `.env` and paste your Groq key after `GROQ_API_KEY=`. Get one at https://console.groq.com/keys. Never commit `.env`; it's already in `.gitignore`.

```bash
pytest -q                          # should print "20 passed"
uvicorn app.main:app --reload --port 8000
```

Open http://localhost:8000/health. It should show `{"status":"ok"}`.

#### Frontend (terminal 2)

```bash
cd frontend
npm install
```

Copy `.env.example` to `.env.local` and leave `NEXT_PUBLIC_API_URL` empty. Locally, the site forwards `/api/...` to the backend on port 8000, so it works in any browser.

```bash
npm run dev
```

Open http://localhost:3000 and ask "What's your best project?"

---

## 2. Before you share it: fill in the gaps

The AI only says what's in `backend/data/profile.json`, and it says "I don't have that detail" for anything missing. These fields are empty on purpose because I didn't want to invent anything:

- [ ] **Internship highlights** (`experience[].highlights`): add 2–3 real bullets each for DigitalPRO and Synclovis. Right now the AI can only give the role and dates.
- [ ] **GitHub links** for FinTech, LinkSnap, RAG Q&A, client_tracker and Clinic (`projects[].github`).
- [ ] **Live demo links** as you deploy each project (`projects[].live`).
- [ ] **CGPA** in `education[].details`, if you want it shown.
- [ ] **This portfolio's own GitHub link** (project id `ai-portfolio`).
- [ ] **Resume:** put your PDF at `frontend/public/resume.pdf`.
- [ ] **Your avatar (the big face on the landing page):** make your own memoji or cartoon avatar. Some ways:
  - **iPhone:** in Messages, open a chat, tap the Memoji sticker button, create yours, then send it to yourself and save the image.
  - **Android / no iPhone:** make one in an avatar app (for example Bitmoji or your phone's built-in avatar maker), or use a clean cut-out photo.
  - Save it as a **square PNG with a transparent background** at `frontend/public/avatar.png`, then set `avatar: "/avatar.png"` in `frontend/src/lib/site.ts`.
  - **Animated, like the reference site:** a short looping clip with a white background saved as `frontend/public/avatar.mp4`, then set `avatarVideo: "/avatar.mp4"`.
  - Don't reuse someone else's memoji; it should be you.

If you change your name, links or suggested questions, update `frontend/src/lib/site.ts` too. The landing page uses it so it can load instantly, before the backend wakes up.

After editing `profile.json`, run `pytest -q`. One test checks that every project has the required fields.

---

## 3. Deploy (free)

### Backend → Render

1. Push this repo to GitHub.
2. On Render, choose **New → Blueprint** and pick the repo. It reads `render.yaml`.
3. When asked, set:
   - `GROQ_API_KEY`: your key
   - `ALLOWED_ORIGINS`: `http://localhost:3000` for now; you'll add the Vercel URL in step 3 of the frontend section
4. After the deploy, open `https://<your-service>.onrender.com/health`.

The free tier sleeps after 15 minutes without traffic, and the first request then takes about a minute. The site handles this: the landing page pings `/health` as soon as it opens, and the chat shows a "waking up" note if the answer is slow.

### Frontend → Vercel

1. On Vercel, choose **Add New → Project**, pick the repo, and set **Root Directory** to `frontend`.
2. Add the environment variable `NEXT_PUBLIC_API_URL` = `https://<your-service>.onrender.com` (no trailing slash).
3. Deploy. Copy the Vercel URL, add it to `ALLOWED_ORIGINS` on Render (comma-separated), and redeploy the backend.

### Protect your key

- In the Groq console, check your limits. The free tier has no bill, but set a spending cap if you ever upgrade.
- The backend already limits each visitor to 30 questions per hour and 500 characters per question. Change these with `RATE_LIMIT_PER_HOUR` and `MAX_MESSAGE_CHARS`.

### If the model stops working

Groq retires models. If chat returns errors, check https://console.groq.com/docs/models, pick a current model that supports tool use, and set `GROQ_MODEL` on Render.

### Changing things after it's live

Both Render and Vercel watch your GitHub repo. Every time you push to `main`, they rebuild and redeploy automatically, in about 1–3 minutes. Your URL stays the same.

| What you want to change | Edit this | Then |
|---|---|---|
| What the AI knows (projects, internships, skills) | `backend/data/profile.json` | Commit and push |
| Landing page text, quick questions, avatar | `frontend/src/lib/site.ts` | Commit and push |
| Resume or avatar image | Replace the file in `frontend/public/` | Commit and push |
| A new certificate | Image in `frontend/public/certs/`, then add an entry to `certifications` in `profile.json` | Commit and push |
| NSS / volunteering photos | Photos in `frontend/public/nss/`, then add them to `volunteering[].photos` in `profile.json` as `{ "src": "/nss/nss-1.webp", "caption": "..." }` | Commit and push |
| Colours or layout | `frontend/src/...` | Commit and push |
| Groq key, model, allowed sites | Render → your service → **Environment** | Save; Render redeploys itself |
| Backend URL the site calls | Vercel → project → **Settings → Environment Variables** | Then **Deployments → Redeploy** |

Typical loop: edit in VS Code, test with `start.bat`, then in VS Code's Source Control panel write a message and click **Commit**, then **Sync Changes**. Watch the deploy in the Vercel and Render dashboards.

If a deploy breaks the site, open Vercel → **Deployments**, pick the last good one, and choose **Promote to Production** to roll back instantly. Then fix the code and push again.

Never commit `backend/.env` or `frontend/.env.local`. They're already in `.gitignore`. Keys belong only in the Render and Vercel dashboards.

---

## 4. How it works (your interview talking points)

1. The browser POSTs the conversation to `/api/chat`.
2. FastAPI validates it. Roles can only be `user` or `assistant`, so nobody can inject a `system` message. It also checks the length limits and the per-IP rate limit (429 with `Retry-After`).
3. `chat.py` sends the system prompt, which holds the whole `profile.json` as text, plus recent history to Groq with **tool definitions**, and **streams** the reply back as **Server-Sent Events**.
4. If the model calls a tool such as `show_projects`, the backend builds the card **from `profile.json`, not from the model's output**, so links and stacks on screen are always real. It sends the card as an SSE event, gives the model the tool result, and runs a second round with tools disabled to write the final text.
5. The frontend parses the SSE stream (`lib/api.ts`) and renders text and cards as they arrive.

**Why no RAG?** The profile is a few KB, so it fits in the prompt. RAG adds latency and retrieval misses with no benefit at this size. Add it when the content outgrows the context window.

**Known limitations (say these before they ask):**
- The rate limiter is in memory, so it only works on a single instance. The fix is to move counters to Redis, as in the FinTech project.
- Prompt-only grounding reduces made-up answers but can't make them impossible. The cards are always factual because they come from data.
- No evaluation set yet. Next step: 20 test questions with expected facts, run in CI.
