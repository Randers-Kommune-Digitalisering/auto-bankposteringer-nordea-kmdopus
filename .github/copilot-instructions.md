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
- Nuxt 4
- PostgreSQL
- TypeScript (strict mode)
- Drizzle ORM (pg-core)
- Zod for boundary validation

When generating code:
- Prefer explicit domain modeling.
- Keep business logic outside UI components.
- Avoid coupling domain logic to a specific ERP.
- Favor long-term maintainability over convenience.

// This instruction ensures that any changes to the system's architecture or design are consistently documented.
// By updating the ARCHITECTURE.md file whenever modifications occur, the project maintains accurate and up-to-date architectural documentation.
When the architecture or design is changed, update the ARCHITECTURE.md markdown-file to reflect the new design.