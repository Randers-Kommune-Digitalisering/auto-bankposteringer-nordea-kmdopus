# Skill: Bank Ingestion (camt.053)

## Scope

Daily pull-based ingestion of camt.053 (ISO 20022) XML via GET web service calls from multiple bank providers.

No outbound communication.
No ERP concerns.

---

## Source Isolation

- Each bank provider is independent.
- Failures in one source must not affect others.
- Fetch windows are deterministic and non-overlapping.

---

## ISO 20022 Alignment

The system must preserve camt.053 structure and semantics:

- Document
- Account
- Entry (Ntry)
- Transaction Details (TxDtls)

Internal representation must mirror ISO structure as closely as possible.

No reinterpretation or restructuring of ISO concepts.

Transactions from CAMT.053 XML should stack if `<BkToCstmrStmt><Stmt><Ntry><Btch>` is defined.

---

## Lowest Common Denominator

Across providers:

- Only consistently available ISO fields may be treated as required.
- Optional ISO fields remain optional.
- Provider-specific quirks must not redefine structure.

The canonical form reflects ISO — not vendor variation.

---

## Idempotency

Idempotency must align with ISO reference semantics.

Stable ISO identifiers (e.g. NtryRef, AcctSvcrRef, TxId, EndToEndId) are preferred.

No uniqueness derived from:
- Amount
- Dates
- Free text fields

---

## Amount & Sign

- `<Amt>` and `<CdtDbtInd>` must remain separate.
- Currency must be explicit.
- No derived signed amount during ingestion.

---

## Temporal Data

- Booking date and value date remain distinct.
- All internal timestamps normalized to UTC.

---

## Non-Goals

- No business logic
- No matching
- No ERP mapping
- No enrichment
- No mutation of ISO semantics
