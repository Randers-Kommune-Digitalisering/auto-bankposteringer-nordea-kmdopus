You are helping build a stateless, open source financial integration engine for municipalities.

The system transforms bank transactions into ERP-compatible accounting payloads using a deterministic rule engine.

Core principles:
- The system must be stateless.
- All behavior must be reproducible from persisted database state.
- The database schema defines the domain.
- The architecture must support multiple ERPs, even though only KMD Opus is currently implemented.
- Rules must be deterministic, auditable, and relationally modeled.
- Avoid hidden state, implicit logic, or denormalized shortcuts.

Technology stack (ordered by importance):
- Nuxt 4 (including Nuxt UI library)
- PostgreSQL
- Drizzle ORM (pg-core)
- TypeScript (strict mode)
- Zod for boundary validation

Security hygiene (financial infrastructure):
- Regularly run vulnerability audits for dependencies, especially after dependency/lockfile changes and before merging.
- Prefer `pnpm audit --prod --audit-level=high` to assess runtime risk, and use `pnpm audit` as needed to include dev tooling.
- Treat `critical` findings as a priority to remediate or explicitly accept with justification.

When generating code:
- Be skeptical of new functionality, challenge assumptions and ask clarifying questions.
- When creating UI components, make sure to mainly utilize Nuxt UI components and patterns, and avoid introducing new dependencies or complex custom components.
- Prefer explicit domain modeling.
- Keep business logic outside UI components.
- Avoid coupling domain logic to a specific ERP.
- Favor long-term maintainability over convenience.

Database migrations policy:
- Do NOT add incremental/numbered migrations.
- When the database schema changes, we will delete everything in `drizzle/` and generate a new single baseline migration.
- Your code changes should assume that workflow (i.e. update schema code, but do not create new migration files).

When the architecture or design is changed, update the ARCHITECTURE.md markdown-file to reflect the new design.