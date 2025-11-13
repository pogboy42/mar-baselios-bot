# Lumina — Mar Baselios Public School Chatbot

This is a simple, embeddable web chatbot named Lumina that answers questions about Mar Baselios Public School using a single JSON knowledge base (`knowledgeBase.json`). The chatbot is implemented in plain HTML/CSS/JavaScript so you can embed it into any website.

Files added:

- `index.html` — Chat UI and quick-action buttons
- `style.css` — Styles for the chat widget
- `lumina.js` — Chat logic, fetches `knowledgeBase.json`, parses queries and generates responses
- `knowledgeBase.json` — The single source of truth for school data (overview, faculty, facilities, events, admissions, contact)

How it works

- The frontend loads `knowledgeBase.json` at startup and answers user questions by matching keywords to JSON fields.
- Responses are dynamic: updating `knowledgeBase.json` will be reflected immediately without changing code.
- The bot supports simple follow-up handling (e.g., after asking about houses it can provide captains), faculty lookups, event details, admissions info, and contact details.

How to run locally

1. Place all files on your web server or open `index.html` directly in your browser. For local file loads, some browsers may block `fetch()` for `file://` — use a simple local server. For example (PowerShell):

```powershell
# start a simple static file server in this folder
python -m http.server 8000; Start-Process 'http://localhost:8000/index.html'
```

2. Open the page and ask queries like:
- "Who is the principal of Mar Baselios Public School?"
- "Tell me about the computer lab."
- "What co-curricular activities are available?"
- "How do I apply for admission to Class XI?"

Updating the knowledge base

- Edit `knowledgeBase.json` to add or change information. Keep the same top-level keys (about, infrastructure, faculty, student_council, houses, senior_secondary, events, admissions, contact) for best results.
- Add new faculty entries to the `faculty` array — Lumina will automatically include them in search results.

Embedding on a website

- Copy `index.html` markup and `lumina.js` logic into an embeddable widget container or iframe. Ensure `knowledgeBase.json` is reachable from the hosting domain.

Notes and limitations

- The current matching is keyword-based and works well for the common, expected questions in a school context. For more robust natural language understanding, integrate an NLP service or model.
- This implementation is intentionally lightweight and suitable for offline, private hosting.

If you want, I can:
- Add more sophisticated matching (synonyms, fuzzy matching).
- Add buttons for suggested follow-ups and quick reply chips.
- Implement a small admin UI to edit `knowledgeBase.json` safely.
