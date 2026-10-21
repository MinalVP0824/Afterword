# Afterword

**Meetings, made into action.**

Afterword is an agentic AI assistant that reads a meeting transcript and turns it into a clear summary, the decisions that were made, tasks with owners and deadlines, and follow-up points. When something in the meeting was left vague, like a task with no owner or a deadline of "soon", Afterword notices it and asks you to clarify before marking the task as ready.

Built for the Agentic AI course project, problem statement **M1-P2: AI-Powered Meeting-to-Action Assistant**.

![Home screen](screenshots/home.png)

## Features

- Paste a transcript, upload a `.txt` file, or load a sample meeting
- Summary, key points, decisions, action items and follow-ups extracted in a few seconds
- Detects tasks with a missing or vague owner, deadline or description
- Asks clarification questions and keeps asking if the answer is still unclear
- Converts spoken deadlines like "by Friday" or "end of the month" into real dates
- Automatically marks follow-up points as resolved once the new information settles them
- Edit any task by hand
- Meeting history saved between sessions
- Export as Markdown or a clean PDF report

![Results page](screenshots/results.png)

## How the agent works

Afterword runs a five-step loop:

1. **Extract:** the LLM reads the transcript and returns structured JSON. The system prompt tells it never to invent names, dates or tasks.
2. **Validate:** Python rules check every task. Owners like "someone" or "the team", deadlines like "soon" or "sometime next week", and tasks like "look into the issue" are flagged.
3. **Clarify:** each problem becomes a question for the user.
4. **Update:** answers are applied and every task is checked again. A vague answer such as "whenever possible" gets rejected and the question is asked again.
5. **Reflect:** the LLM looks at what changed and decides which follow-up points are now settled. It only returns the index numbers of resolved items, so it cannot rewrite or invent follow-ups.

Meetings and the full question and answer history are stored in a JSON file, which acts as the agent's long-term memory.

![Resolved follow-ups](screenshots/followups.png)

## Tech stack

| Part | Technology |
|---|---|
| Backend | Python, FastAPI, Pydantic |
| LLM | Groq (`openai/gpt-oss-120b`) through the OpenAI-compatible API. Gemini and OpenAI also work by changing `.env` |
| Date parsing | dateparser plus custom rules |
| Frontend | React, Vite, Tailwind CSS, Lucide icons |
| Storage | JSON file |

## Project structure

```
afterword/
├── backend/
│   ├── app/
│   │   ├── main.py        API endpoints
│   │   ├── agent.py       the five-step agent loop
│   │   ├── prompts.py     system prompts
│   │   ├── llm.py         LLM client with timeout and JSON retry
│   │   ├── schemas.py     data models
│   │   ├── storage.py     saves meetings
│   │   └── config.py      settings from .env
│   ├── samples/           three example transcripts
│   ├── list_models.py     lists models available to your API key
│   └── requirements.txt
└── frontend/
    └── src/
        ├── App.jsx
        ├── api.js
        ├── export.js      Markdown export
        └── components/    Sidebar, NewMeeting, MeetingView, TaskCard, ClarifyPanel
```

## Running it locally

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # Windows
# source venv/bin/activate       # Mac / Linux
pip install -r requirements.txt
```

Create a file called `.env` inside `backend`:

```
LLM_API_KEY=your_groq_api_key
LLM_BASE_URL=https://api.groq.com/openai/v1
LLM_MODEL=openai/gpt-oss-120b
LLM_REASONING_EFFORT=low
LLM_TIMEOUT=60
FRONTEND_ORIGINS=http://localhost:5173
```

A free Groq key is available at https://console.groq.com. Then start the server:

```bash
uvicorn app.main:app --reload
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/analyze` | Analyse a transcript |
| GET | `/api/meetings` | List saved meetings |
| GET | `/api/meetings/{id}` | Get one meeting |
| POST | `/api/meetings/{id}/clarify` | Answer the agent's questions |
| PATCH | `/api/meetings/{id}/tasks/{task_id}` | Edit a task |
| DELETE | `/api/meetings/{id}` | Delete a meeting |
| GET | `/api/samples` | Sample transcripts |

Interactive API docs are at http://localhost:8000/docs while the backend is running.

## Author

Minal Venkatesha Poppur, AIML, CMR Institute of Technology