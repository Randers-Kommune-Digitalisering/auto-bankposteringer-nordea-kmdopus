# Architecture (short)

This repo is a stateless financial integration engine:
- All *state* lives in Postgres.
- Runtime behavior is deterministic from persisted state + inputs.
- Bank ingestion stores raw source documents for auditability and reproducibility.

## Core flow

1) Fetch raw bank documents (transport/adapters)
2) Persist document + normalize into canonical CAMT tables
3) Match transactions against deterministic rules
4) Generate ERP posting payloads and execute ERP integration

## Key concepts (domain)

- `banking_document`: raw source content (e.g. CAMT.053 XML) + hash (idempotency)
- `banking_statement`: statement header/account info extracted from document
- `banking_statement_balance`: statement balances (OPBD/CLBD/CLAV, etc.)
- `transaction`: normalized entry/tx details (Refs, Parties, BkTxCd, remittance)
- `rule` + `rule_banking_condition`: deterministic matching rules (CAMT-keyed)
- `transaction_processing`: processing status / rule-applied locking
- `banking_adapter_cursor`: opaque cursor per (account, adapter) for incremental fetching
- `run`: batch execution unit (audit/logging)

## System diagram

```mermaid
flowchart LR
  subgraph UI[Nuxt UI]
    Pages[Pages/Components]
  end

  subgraph API[Nitro server/api]
    RunsAPI[/api/runs]
    TxAPI[/api/transactions]
    RulesAPI[/api/rules]
    SettingsAPI[/api/settings]
  end

  subgraph Engine[Engine (domain + handlers)]
    Fetch[Bank adapter fetch\n(fetchDocuments)]
    Ingest[CAMT ingest\n(ingestCamt053Document)]
    Match[Matching service]
    Post[Posting command]
    ERP[ERP adapter]
  end

  subgraph DB[PostgreSQL]
    Doc[(banking_document)]
    Stmt[(banking_statement)]
    Bal[(banking_statement_balance)]
    Tx[(transaction)]
    Rule[(rule + conditions)]
    Cursor[(banking_adapter_cursor)]
    Run[(run)]
  end

  Pages --> API
  RunsAPI --> DB
  TxAPI --> DB
  RulesAPI --> DB
  SettingsAPI --> DB

  Fetch -->|raw XML| Ingest
  Ingest --> Doc
  Ingest --> Stmt
  Ingest --> Bal
  Ingest --> Tx

  Fetch --> Cursor
  Cursor --> Fetch

  Tx --> Match
  Rule --> Match
  Match --> Post
  Post --> ERP
  ERP --> DB

  Run --> Ingest
```

## Notes on complexity

If you feel the system is getting "too many things":
- Keep adapters dumb: transport + auth + returning raw documents.
- Keep ingestion deterministic and central: document hash + canonical tables.
- Keep matching/posting free of vendor logic: only use canonical CAMT columns.
