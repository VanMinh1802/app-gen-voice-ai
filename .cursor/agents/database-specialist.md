---
name: database-specialist
description: DEPRECATED â€” This agent references the wrong tech stack. Do NOT use.
---

> **âš ï¸ DEPRECATED** â€” This agent guides toward PostgreSQL/Prisma/Drizzle which are
> NOT used in this project. This project is a **client-side browser app** that stores:
>
> - **TTS Models** â†’ Cloudflare R2 bucket (downloaded lazily)
> - **History/Audio** â†’ IndexedDB (browser, user-managed)
> - **Settings** â†’ localStorage (permanent, browser-local)
> - **Auth** â†’ Genation SDK (server-side session only)
>
> There is no server-side database (no PostgreSQL, no SQLite, no Drizzle ORM).
> No migrations, no ORM queries, no database connections.
>
> **If you need to work with IndexedDB**, use the existing patterns in
> src/lib/storage/ or src/features/tts/services/.
>
> **For other projects**, use this agent only when building with a traditional
> server-side database (PostgreSQL, MySQL, SQLite, Prisma, Drizzle).
