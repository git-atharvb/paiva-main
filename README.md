# PAIVA

PAIVA is a full-stack personalized AI virtual assistant. The app combines a React/Vite workspace with a Spring Boot backend for authenticated streaming chat, conversation history, document/image/link context, YouTube transcript support, long-term memory summaries, and user settings.

## Stack

- Frontend: React 19, Vite, TypeScript, Tailwind CSS, lucide-react
- Backend: Java 17, Spring Boot 3, Spring Security, MongoDB, Reactor, WebClient
- AI: OpenAI-compatible Groq chat completions
- Storage: MongoDB conversations, messages, users, refresh tokens, login audit events

## Current Features

- Email/password and Google sign-in
- JWT access tokens plus refresh tokens
- Streaming AI responses
- Conversation list, rename, delete, and split-view comparison
- Custom user instructions
- Personalized assistant profile with assistant name, user context, response style, and memory toggle
- Rolling chat history plus background long-term summaries
- Backend-driven model catalog for the chat model picker
- Document text extraction for PDF, text, CSV, Office files
- Image attachment for vision-capable models
- Link scraping and YouTube transcript context
- Optional contextual images rendered from wiki image markers
- Voice typing, text-to-speech, copy, markdown export, and PDF export
- Theme support and responsive dashboard layout

## Setup

1. Install frontend dependencies:

```bash
npm install
```

2. Review the environment template:

```bash
copy .env.example .env
```

Set `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID`, and `GROQ_API_KEY` in your terminal, IDE run configuration, deployment environment, or frontend `.env` file. The backend has development defaults for local startup, but production must provide real secrets.

3. Start MongoDB locally or set `MONGODB_URI` to a hosted database.

4. Run the backend:

```bash
cd backend
C:\apache-maven-3.9.16\bin\mvn.cmd spring-boot:run
```

5. Run the frontend:

```bash
npm run dev
```

## Verification

```bash
npm run lint
npm run build
cd backend
C:\apache-maven-3.9.16\bin\mvn.cmd test
```

## Upgrade Direction

The detailed modernization plan is in [UPGRADE_ROADMAP.md](./UPGRADE_ROADMAP.md).
