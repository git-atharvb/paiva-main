# PAIVA Upgrade Roadmap

## Product Vision

Turn PAIVA into a serious AI workspace: fast, secure, personal, multimodal, observable, and pleasant to use every day. The destination is not just a chat UI, but an assistant platform with reliable memory, citations, workspace artifacts, voice, files, and explainable tool use.

## Phase 0: Foundation and Safety

- Move all secrets and provider IDs out of committed source.
- Add `.env.example` and document required runtime variables.
- Replace wildcard CORS annotations with environment-driven allowed origins.
- Enforce conversation ownership for every message fetch, stream, rename, and delete path.
- Replace `RuntimeException` authorization failures with typed 403/404 responses.
- Add backend tests for auth, conversation access control, refresh tokens, and document extraction.
- Add frontend tests for auth redirects, streaming parsing, attachment state, and conversation actions.

## Phase 1: Frontend Architecture

- Split `ChatArea.tsx` into focused modules: composer, message list, markdown renderer, exports, speech, attachments, and streaming controller.
- Move model and voice options into backend-provided configuration.
- Use a query/cache layer for conversations and settings.
- Add virtualized message rendering for long chats.
- Add responsive split-view controls for mobile and tablet.
- Reduce bundle size with lazy-loaded export libraries, markdown highlighter, and PDF/image tools.

## Phase 2: AI Orchestration

- Extract backend chat orchestration into services for prompt building, memory, retrieval, attachments, tools, and model routing.
- Replace heuristic search triggering with an explicit tool-selection layer.
- Add source-aware web search with titles, URLs, timestamps, and citations.
- Add resilient provider abstraction for Groq, OpenAI-compatible providers, local models, and fallbacks.
- Add per-model capability metadata for vision, context size, reasoning, speed, and cost.
- Store tool calls and retrieval snippets beside messages for transparency and replay.

## Phase 3: Memory and Knowledge

- Add user profile memory with review, pin, edit, and delete controls.
- Add conversation summaries with versioning and freshness timestamps.
- Add vector search for uploaded documents and selected conversations.
- Support workspace collections for files, notes, links, and reusable research folders.
- Add user-controlled memory privacy modes.

## Phase 4: Security and Production Readiness

- Move access tokens to safer storage strategy or hardened cookie flow.
- Add rate limiting and abuse protection for auth, chat, extraction, image download, and scraping.
- Validate file MIME types server-side and scan size/page/count limits.
- Prevent SSRF in URL scraping and image download endpoints.
- Add structured logging, request IDs, metrics, health checks, and audit trails.
- Add Docker Compose for frontend, backend, and MongoDB.
- Add CI for lint, build, backend tests, frontend tests, and dependency audit.

## Phase 5: Premium Experience

- Add command palette, keyboard shortcuts, and searchable conversation history.
- Add prompt templates and reusable assistant personas.
- Add artifact panels for generated code, tables, summaries, charts, and documents.
- Add collaborative sharing and read-only conversation links.
- Add voice conversation mode with proper streaming audio.
- Add onboarding, empty states, loading skeletons, and polished error recovery.

## Phase 6: Scale and Maintainability

- Add API versioning and typed OpenAPI documentation.
- Introduce service-level interfaces and contract tests.
- Add database indexes and migration strategy.
- Add background job queue for summarization, file ingestion, and large exports.
- Add feature flags for experimental models and tools.
- Add performance budgets and bundle analysis.

## Immediate Next Build Slice

1. Add backend integration tests around conversation access.
2. Split frontend chat composer and message renderer out of `ChatArea.tsx`.
3. Lazy-load export dependencies to reduce initial dashboard bundle.
4. Harden CORS, URL scraping, and image download for production deployments.
5. Add Docker Compose and CI so the project can be run and verified consistently.
